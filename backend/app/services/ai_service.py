"""AI Service — uses real statistical analysis, no paid API required."""
import pandas as pd
import numpy as np
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.dataset import Dataset
import json


def analyse_dataframe(df: pd.DataFrame) -> dict:
    """Run real statistical analysis on a dataframe."""
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    text_cols    = df.select_dtypes(include="object").columns.tolist()
    results = {}

    # Basic stats
    results["shape"]       = {"rows": len(df), "cols": len(df.columns)}
    results["missing"]     = int(df.isnull().sum().sum())
    results["duplicates"]  = int(df.duplicated().sum())
    results["numeric_cols"] = numeric_cols
    results["text_cols"]    = text_cols

    # Stats per numeric column
    col_stats = {}
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) == 0:
            continue
        col_stats[col] = {
            "mean":   round(float(s.mean()), 2),
            "median": round(float(s.median()), 2),
            "std":    round(float(s.std()), 2),
            "min":    round(float(s.min()), 2),
            "max":    round(float(s.max()), 2),
            "trend":  "increasing" if s.iloc[-1] > s.iloc[0] else "decreasing" if s.iloc[-1] < s.iloc[0] else "stable",
        }
    results["col_stats"] = col_stats

    # Correlations
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr()
        high_corr = []
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                val = corr.iloc[i, j]
                if abs(val) > 0.7:
                    high_corr.append({
                        "col1": numeric_cols[i],
                        "col2": numeric_cols[j],
                        "correlation": round(float(val), 3)
                    })
        results["high_correlations"] = high_corr

    # Anomalies
    anomalies = []
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) < 4:
            continue
        mean, std = s.mean(), s.std()
        if std == 0:
            continue
        z = (s - mean) / std
        outliers = z[abs(z) > 2.5]
        if len(outliers) > 0:
            anomalies.append({
                "column": col,
                "count":  len(outliers),
                "values": [round(float(v), 2) for v in s[abs(z) > 2.5].head(3).tolist()]
            })
    results["anomalies"] = anomalies

    return results


def generate_insights(stats: dict) -> list:
    """Generate human-readable insights from stats."""
    insights = []
    col_stats = stats.get("col_stats", {})
    shape     = stats.get("shape", {})

    insights.append({
        "id": "overview",
        "severity": "info",
        "title": "Dataset Overview",
        "detail": f"Your dataset contains {shape.get('rows',0):,} rows and {shape.get('cols',0)} columns. "
                  f"Missing values: {stats.get('missing',0)}. Duplicate rows: {stats.get('duplicates',0)}.",
        "confidence": 1.0,
        "action": "Review missing values and duplicates before drawing conclusions."
    })

    for col, s in col_stats.items():
        trend = s["trend"]
        pct   = round((s["max"] - s["min"]) / s["min"] * 100, 1) if s["min"] != 0 else 0
        severity = "positive" if trend == "increasing" else "warning" if trend == "decreasing" else "info"
        insights.append({
            "id": f"trend_{col}",
            "severity": severity,
            "title": f"{col} is {trend}",
            "detail": f"{col} ranges from {s['min']:,} to {s['max']:,} (mean: {s['mean']:,}). "
                      f"Overall change: {pct}%. Standard deviation: {s['std']:,}.",
            "confidence": 0.85,
            "action": f"Monitor {col} closely." if trend == "decreasing" else f"{col} shows positive momentum."
        })

    for corr in stats.get("high_correlations", []):
        direction = "positively" if corr["correlation"] > 0 else "negatively"
        insights.append({
            "id": f"corr_{corr['col1']}_{corr['col2']}",
            "severity": "info",
            "title": f"Strong link: {corr['col1']} & {corr['col2']}",
            "detail": f"{corr['col1']} and {corr['col2']} are {direction} correlated (r={corr['correlation']}). "
                      f"Changes in one strongly predict changes in the other.",
            "confidence": 0.9,
            "action": f"Use {corr['col1']} as a leading indicator for {corr['col2']}."
        })

    for anom in stats.get("anomalies", []):
        insights.append({
            "id": f"anomaly_{anom['column']}",
            "severity": "critical",
            "title": f"Anomalies detected in {anom['column']}",
            "detail": f"Found {anom['count']} outlier(s) in {anom['column']} with Z-score > 2.5. "
                      f"Sample values: {anom['values']}.",
            "confidence": 0.92,
            "action": f"Investigate these {anom['count']} anomalous records in {anom['column']}."
        })

    return insights


def answer_question(question: str, stats: dict) -> str:
    """Answer a question based on real stats."""
    q   = question.lower()
    col_stats  = stats.get("col_stats", {})
    shape      = stats.get("shape", {})
    anomalies  = stats.get("anomalies", [])
    corr       = stats.get("high_correlations", [])

    if any(w in q for w in ["overview", "summary", "summarise", "summarize", "about", "describe"]):
        lines = [f"**Dataset Summary**",
                 f"- Rows: {shape.get('rows',0):,}  |  Columns: {shape.get('cols',0)}",
                 f"- Missing values: {stats.get('missing',0)}",
                 f"- Duplicate rows: {stats.get('duplicates',0)}",
                 f"- Numeric columns: {', '.join(stats.get('numeric_cols',[]))}",
                 f"- Text columns: {', '.join(stats.get('text_cols',[]))}"]
        return "\n".join(lines)

    if any(w in q for w in ["trend", "increase", "decrease", "grow", "drop", "change"]):
        if not col_stats:
            return "No numeric columns found to analyse trends."
        lines = ["**Trend Analysis**"]
        for col, s in col_stats.items():
            lines.append(f"- {col}: {s['trend']} (min: {s['min']:,}, max: {s['max']:,}, mean: {s['mean']:,})")
        return "\n".join(lines)

    if any(w in q for w in ["anomaly", "anomalies", "outlier", "unusual", "weird"]):
        if not anomalies:
            return "No significant anomalies detected in your dataset (Z-score threshold: 2.5)."
        lines = ["**Anomalies Detected**"]
        for a in anomalies:
            lines.append(f"- {a['column']}: {a['count']} outlier(s) found. Values: {a['values']}")
        return "\n".join(lines)

    if any(w in q for w in ["correlat", "relationship", "related", "link", "connect"]):
        if not corr:
            return "No strong correlations found (threshold: r > 0.7)."
        lines = ["**Strong Correlations**"]
        for c in corr:
            direction = "positive" if c["correlation"] > 0 else "negative"
            lines.append(f"- {c['col1']} ↔ {c['col2']}: r={c['correlation']} ({direction})")
        return "\n".join(lines)

    if any(w in q for w in ["recommend", "suggest", "action", "what should", "advice"]):
        lines = ["**Recommendations based on your data:**"]
        for a in anomalies:
            lines.append(f"- Investigate {a['count']} anomalies in {a['column']}")
        for col, s in col_stats.items():
            if s["trend"] == "decreasing":
                lines.append(f"- {col} is declining — identify root cause and take corrective action")
            elif s["trend"] == "increasing":
                lines.append(f"- {col} is growing — maintain current strategy")
        if stats.get("missing", 0) > 0:
            lines.append(f"- Address {stats['missing']} missing values to improve analysis accuracy")
        if len(lines) == 1:
            lines.append("- Your data looks healthy. Continue monitoring key metrics.")
        return "\n".join(lines)

    if any(w in q for w in ["max", "highest", "top", "best", "most"]):
        lines = ["**Maximum Values**"]
        for col, s in col_stats.items():
            lines.append(f"- {col}: max = {s['max']:,}")
        return "\n".join(lines)

    if any(w in q for w in ["min", "lowest", "worst", "least"]):
        lines = ["**Minimum Values**"]
        for col, s in col_stats.items():
            lines.append(f"- {col}: min = {s['min']:,}")
        return "\n".join(lines)

    if any(w in q for w in ["average", "mean", "typical"]):
        lines = ["**Average Values**"]
        for col, s in col_stats.items():
            lines.append(f"- {col}: mean = {s['mean']:,}  |  median = {s['median']:,}")
        return "\n".join(lines)

    # Default
    lines = ["Based on your dataset, here is what I found:\n"]
    for col, s in list(col_stats.items())[:3]:
        lines.append(f"**{col}**: mean={s['mean']:,}, trend={s['trend']}, range={s['min']:,}–{s['max']:,}")
    if anomalies:
        lines.append(f"\n⚠️ {len(anomalies)} column(s) have anomalies worth investigating.")
    if corr:
        lines.append(f"\n🔗 {len(corr)} strong correlation(s) found between columns.")
    return "\n".join(lines)


class AIService:
    async def generate_insights(self, dataset_id: str, db: AsyncSession) -> list:
        try:
            result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
            dataset = result.scalar_one_or_none()
            if not dataset or not dataset.file_path:
                return []
            path = Path(dataset.file_path)
            if not path.exists():
                return []
            df = pd.read_csv(path) if path.suffix == ".csv" else pd.read_excel(path)
            stats = analyse_dataframe(df)
            return generate_insights(stats)
        except Exception as e:
            return [{"id":"error","severity":"warning","title":"Analysis error",
                     "detail":str(e),"confidence":0,"action":"Check your file format."}]

    async def answer_question(self, dataset_id: str, question: str,
                               history: list, db: AsyncSession) -> str:
        try:
            result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
            dataset = result.scalar_one_or_none()
            if not dataset or not dataset.file_path:
                return "No dataset found. Please upload a file first."
            path = Path(dataset.file_path)
            if not path.exists():
                return "Dataset file not found on server."
            df = pd.read_csv(path) if path.suffix == ".csv" else pd.read_excel(path)
            stats = analyse_dataframe(df)
            return answer_question(question, stats)
        except Exception as e:
            return f"Error analysing your data: {str(e)}"

    async def generate_sql(self, dataset_id: str, question: str, db: AsyncSession) -> str:
        return "-- SQL generation requires API credits.\n-- Your dataset is loaded correctly."


ai_service = AIService()