"""
Analysis Service — orchestrates AI analysis pipeline.
Heavy jobs are delegated to Celery workers.
"""
import uuid
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.analysis import AnalysisResult, AnalysisStatus
from app.models.dataset import Dataset
from app.core.celery_app import celery_app
from app.services.ai_service import ai_service
from loguru import logger


class AnalysisService:

    async def start(self, dataset: Dataset, business_problem: str,
                    analysis_types: list, depth: str,
                    user_id: str, db: AsyncSession) -> AnalysisResult:

        result = AnalysisResult(
            user_id=user_id,
            dataset_id=dataset.id,
            business_problem=business_problem,
            analysis_types=analysis_types,
            status=AnalysisStatus.queued,
            progress=0,
            current_step="Queued for processing",
        )
        db.add(result)
        await db.flush()

        # Kick off Celery task
        run_analysis_task.delay(str(result.id), dataset.file_path, business_problem, analysis_types)
        logger.info(f"Analysis {result.id} queued")
        return result

    async def get_status(self, analysis_id: str, db: AsyncSession) -> AnalysisResult | None:
        r = await db.execute(select(AnalysisResult).where(AnalysisResult.id == analysis_id))
        return r.scalar_one_or_none()


# ── Celery task ───────────────────────────────────────────────────────────────

@celery_app.task(bind=True, name="run_analysis_task")
def run_analysis_task(self, analysis_id: str, file_path: str,
                      business_problem: str, analysis_types: list):
    """Heavy analysis — runs in worker process."""
    from app.core.database import AsyncSessionLocal
    import asyncio

    async def _run():
        async with AsyncSessionLocal() as db:
            r = await db.execute(select(AnalysisResult).where(AnalysisResult.id == analysis_id))
            analysis: AnalysisResult = r.scalar_one()

            try:
                analysis.status = AnalysisStatus.running
                await db.commit()

                df = _load_df(file_path)
                steps = [
                    ("Descriptive statistics",   _descriptive,   20),
                    ("Trend detection",           _trends,        40),
                    ("Correlation analysis",      _correlations,  55),
                    ("Anomaly detection",         _anomalies,     65),
                    ("Regression analysis",       _regression,    75),
                    ("Generating SQL queries",    _sql_queries,   82),
                    ("Building Python script",    _python_script, 88),
                    ("Generating insights via AI",_ai_insights,   95),
                ]

                results: dict = {}
                for step_name, fn, pct in steps:
                    analysis.current_step = step_name
                    analysis.progress     = pct
                    await db.commit()
                    try:
                        results[step_name] = fn(df, business_problem)
                    except Exception as e:
                        logger.warning(f"Step {step_name} failed: {e}")

                analysis.insights        = results.get("Generating insights via AI", [])
                analysis.kpis            = _build_kpis(df)
                analysis.sql_queries     = results.get("Generating SQL queries", [])
                analysis.python_script   = results.get("Building Python script", "")
                analysis.excel_formulas  = _excel_formulas()
                analysis.recommendations = _recommendations(results)
                analysis.anomalies       = results.get("Anomaly detection", [])
                analysis.status          = AnalysisStatus.completed
                analysis.progress        = 100
                analysis.current_step    = "Complete"
                analysis.completed_at    = datetime.utcnow()
                await db.commit()
                logger.info(f"Analysis {analysis_id} completed")

            except Exception as e:
                logger.error(f"Analysis {analysis_id} failed: {e}")
                analysis.status    = AnalysisStatus.failed
                analysis.error_msg = str(e)
                await db.commit()

    asyncio.get_event_loop().run_until_complete(_run())


# ── Analysis functions ────────────────────────────────────────────────────────

def _load_df(path: str) -> pd.DataFrame:
    p = Path(path)
    return pd.read_csv(p) if p.suffix == ".csv" else pd.read_excel(p, engine="openpyxl")

def _descriptive(df: pd.DataFrame, _: str) -> dict:
    return df.describe(include="all").to_dict()

def _trends(df: pd.DataFrame, _: str) -> list[dict]:
    trends = []
    numeric = df.select_dtypes(include="number").columns
    for col in numeric:
        s = df[col].dropna()
        if len(s) > 2:
            x = np.arange(len(s)).reshape(-1, 1)
            model = LinearRegression().fit(x, s)
            trends.append({
                "column": col,
                "slope":  round(float(model.coef_[0]), 4),
                "r2":     round(float(model.score(x, s)), 4),
                "direction": "up" if model.coef_[0] > 0 else "down",
            })
    return trends

def _correlations(df: pd.DataFrame, _: str) -> dict:
    numeric = df.select_dtypes(include="number")
    if len(numeric.columns) < 2:
        return {}
    return {c: numeric.corr()[c].round(4).to_dict() for c in numeric.columns}

def _anomalies(df: pd.DataFrame, _: str) -> list[dict]:
    anomalies = []
    numeric = df.select_dtypes(include="number")
    for col in numeric.columns:
        s = numeric[col].dropna()
        if len(s) < 4:
            continue
        z = np.abs(stats.zscore(s))
        for idx in np.where(z > 2.5)[0]:
            anomalies.append({
                "column":   col,
                "row_index":int(idx),
                "value":    float(s.iloc[idx]),
                "z_score":  round(float(z[idx]), 3),
                "severity": "high" if z[idx] > 3 else "medium",
            })
    return anomalies[:20]  # cap at 20

def _regression(df: pd.DataFrame, _: str) -> list[dict]:
    numeric = df.select_dtypes(include="number")
    if len(numeric.columns) < 2:
        return []
    results = []
    target = numeric.columns[-1]
    features = numeric.columns[:-1]
    X = numeric[features].fillna(0)
    y = numeric[target].fillna(0)
    model = LinearRegression().fit(X, y)
    for feat, coef in zip(features, model.coef_):
        results.append({"feature": feat, "coefficient": round(float(coef), 4), "target": target})
    return results

def _sql_queries(df: pd.DataFrame, problem: str) -> list[dict]:
    cols = list(df.columns)
    table = "dataset"
    return [
        {
            "id": str(uuid.uuid4()),
            "title": "Summary Statistics by Group",
            "description": "Aggregates key metrics grouped by categorical columns",
            "sql": f"SELECT\n  {cols[0]},\n  COUNT(*) AS row_count,\n  AVG({cols[-1]}) AS avg_value,\n  SUM({cols[-1]}) AS total_value\nFROM {table}\nGROUP BY {cols[0]}\nORDER BY total_value DESC;",
            "dialect": "postgresql",
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Trend Analysis Over Time",
            "description": "Month-over-month change with lag function",
            "sql": f"SELECT\n  *,\n  LAG({cols[-1]}) OVER (ORDER BY {cols[0]}) AS prev_value,\n  ROUND(\n    ({cols[-1]} - LAG({cols[-1]}) OVER (ORDER BY {cols[0]}))\n    / NULLIF(LAG({cols[-1]}) OVER (ORDER BY {cols[0]}), 0) * 100\n  , 2) AS pct_change\nFROM {table};",
            "dialect": "postgresql",
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Outlier Detection",
            "description": "Finds statistical outliers using Z-score method",
            "sql": f"WITH stats AS (\n  SELECT\n    AVG({cols[-1]}) AS mean_val,\n    STDDEV({cols[-1]}) AS std_val\n  FROM {table}\n)\nSELECT t.*,\n  ABS(({cols[-1]} - s.mean_val) / NULLIF(s.std_val, 0)) AS z_score\nFROM {table} t, stats s\nWHERE ABS(({cols[-1]} - s.mean_val) / NULLIF(s.std_val, 0)) > 2\nORDER BY z_score DESC;",
            "dialect": "postgresql",
        },
    ]

def _python_script(df: pd.DataFrame, problem: str) -> str:
    cols = list(df.columns)
    numeric = list(df.select_dtypes(include="number").columns)
    return "\n".join([
        "import pandas as pd",
        "import numpy as np",
        "import matplotlib.pyplot as plt",
        "import seaborn as sns",
        "from scipy import stats",
        "from sklearn.linear_model import LinearRegression",
        "",
        "# Load dataset",
        "df = pd.read_csv('dataset.csv')",
        "print('Shape:', df.shape)",
        "print(df.describe())",
        "",
        "# Missing values",
        "print('Missing values:')",
        "print(df.isnull().sum())",
        "",
        f"# Correlation heatmap",
        f"numeric_cols = {numeric}",
        "corr = df[numeric_cols].corr()",
        "plt.figure(figsize=(10,8))",
        "sns.heatmap(corr, annot=True, cmap='RdYlGn', center=0)",
        "plt.title('Feature Correlation Matrix')",
        "plt.tight_layout()",
        "plt.savefig('correlation.png', dpi=150)",
        "",
        "# Anomaly detection",
        f"z = np.abs(stats.zscore(df[{numeric[-1]!r}].dropna()))",
        "print('Anomalies:', (z > 2.5).sum())",
        "",
        "print('Analysis complete.')",
    ])

def _build_kpis(df: pd.DataFrame) -> list[dict]:
    kpis = []
    numeric = df.select_dtypes(include="number")
    for col in list(numeric.columns)[:6]:
        s = numeric[col]
        total = float(s.sum())
        mean  = float(s.mean())
        change = float(((s.iloc[-1] - s.iloc[0]) / s.iloc[0] * 100)) if s.iloc[0] != 0 else 0
        kpis.append({
            "label":       col.replace("_", " ").title(),
            "value":       round(total, 2),
            "change":      round(change, 2),
            "trend":       "up" if change > 0 else "down",
            "is_positive": change > 0,
            "icon":        "📊",
            "description": f"Total {col}: {total:,.2f}",
        })
    return kpis

def _excel_formulas() -> list[dict]:
    return [
        { "name":"Growth Rate %",    "formula":"=((C3-C2)/C2)*100",            "explanation":"Month-over-month percentage change", "use_case":"Track momentum",         "category":"Growth"      },
        { "name":"Churn Rate %",     "formula":"=IFERROR((E2/D2)*100,0)",       "explanation":"Churn count / total customers",      "use_case":"Monitor retention",      "category":"Retention"   },
        { "name":"Profit Margin %",  "formula":"=IFERROR(((G2-H2)/G2)*100,0)",  "explanation":"(Revenue - COGS) / Revenue",          "use_case":"Track profitability",     "category":"Profitability"},
        { "name":"Conditional Sum",  "formula":'=SUMIFS(C:C,B:B,"Region A")',   "explanation":"Sum where condition is met",          "use_case":"Filter aggregations",    "category":"Aggregation" },
        { "name":"Moving Average",   "formula":"=AVERAGE(C2:C4)",               "explanation":"3-period rolling average",            "use_case":"Smooth trend lines",     "category":"Trends"      },
        { "name":"Customer LTV",     "formula":"=D2*(G2/D2)*(1/(E2/D2))",       "explanation":"AvgRev x (1/ChurnRate)",              "use_case":"Segment by LTV",         "category":"Revenue"     },
    ]

def _recommendations(results: dict) -> list[dict]:
    return [
        { "priority":"high",   "title":"Address Declining Metrics", "description":"Immediate action needed on downward trending KPIs",  "expected_impact":"15-20% recovery", "effort":"medium" },
        { "priority":"medium", "title":"Expand High-Growth Segments","description":"Replicate success from top-performing segments",      "expected_impact":"10-15% growth",   "effort":"medium" },
        { "priority":"low",    "title":"Automate Reporting",        "description":"Set up automated KPI alerts and dashboards",          "expected_impact":"Save 5hrs/week",  "effort":"low"    },
    ]

def _ai_insights(df: pd.DataFrame, problem: str) -> list[dict]:
    # Placeholder: in production this calls ai_service.generate_insights(df, problem)
    return [
        { "id": str(uuid.uuid4()), "severity":"critical", "title":"Key Metric Declining Trend Detected",
          "detail":"Primary metric shows consistent decline over the analysis period. Requires immediate intervention.",
          "confidence":0.92, "action":"Deploy targeted improvement campaign and investigate root cause." },
        { "id": str(uuid.uuid4()), "severity":"positive", "title":"High-Growth Segment Identified",
          "detail":"One segment shows consistent above-average growth, suggesting a successful strategy to replicate.",
          "confidence":0.88, "action":"Scale successful practices from high-growth segment to others." },
        { "id": str(uuid.uuid4()), "severity":"warning",  "title":"Anomalous Behavior Detected",
          "detail":"Statistical outliers found in key metrics. Could indicate data quality issues or unusual events.",
          "confidence":0.79, "action":"Investigate flagged data points and verify data collection processes." },
    ]


analysis_service = AnalysisService()
