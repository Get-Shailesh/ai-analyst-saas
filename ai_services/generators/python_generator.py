"""Python script generator from dataset schema."""

def generate_script(columns: list[dict], filename: str = "dataset.csv") -> str:
    col_names = [c["name"] for c in columns]
    num_cols  = [c["name"] for c in columns if c["dtype"] not in ("object", "string")]
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "csv"
    load_line = f"df = pd.read_csv('{filename}')" if ext == "csv" else f"df = pd.read_excel('{filename}')"

    lines = [
        "#!/usr/bin/env python3",
        '"""Auto-generated analysis script by AI Business Analyst."""',
        "",
        "import pandas as pd",
        "import numpy as np",
        "import matplotlib.pyplot as plt",
        "import seaborn as sns",
        "from scipy import stats",
        "from sklearn.linear_model import LinearRegression",
        "from sklearn.preprocessing import StandardScaler",
        "",
        "# ── 1. Load data ──────────────────────────────────────",
        load_line,
        "print(f'Loaded {len(df):,} rows × {len(df.columns)} columns')",
        "print(df.dtypes)",
        "",
        "# ── 2. Data quality ───────────────────────────────────",
        "print('\\n=== Missing Values ===')",
        "print(df.isnull().sum())",
        "print(f'Duplicate rows: {df.duplicated().sum()}')",
        "",
        "# ── 3. Descriptive statistics ─────────────────────────",
        "print('\\n=== Descriptive Stats ===')",
        "print(df.describe())",
        "",
    ]

    if num_cols:
        lines += [
            "# ── 4. Correlation matrix ─────────────────────────────",
            f"num_cols = {num_cols}",
            "corr = df[num_cols].corr()",
            "plt.figure(figsize=(10, 8))",
            "sns.heatmap(corr, annot=True, cmap='RdYlGn', center=0, fmt='.2f', linewidths=0.5)",
            "plt.title('Feature Correlation Matrix')",
            "plt.tight_layout()",
            "plt.savefig('correlation_heatmap.png', dpi=150, bbox_inches='tight')",
            "plt.close()",
            "print('Saved: correlation_heatmap.png')",
            "",
            "# ── 5. Trend analysis ─────────────────────────────────",
            f"target = '{num_cols[-1]}'",
            "x = np.arange(len(df)).reshape(-1, 1)",
            "model = LinearRegression().fit(x, df[target].fillna(0))",
            "slope = model.coef_[0]",
            "r2    = model.score(x, df[target].fillna(0))",
            "direction = 'upward' if slope > 0 else 'downward'",
            "print(f'\\nTrend ({target}): {direction} | slope={slope:,.2f} | R²={r2:.3f}')",
            "",
            "# ── 6. Anomaly detection (Z-score) ────────────────────",
            "z_scores = np.abs(stats.zscore(df[num_cols].fillna(0)))",
            "anomaly_mask = (z_scores > 2.5).any(axis=1)",
            "print(f'\\nAnomalous rows (|Z| > 2.5): {anomaly_mask.sum()}')",
            "if anomaly_mask.sum() > 0:",
            "    print(df[anomaly_mask].head(10))",
            "",
        ]

    lines += [
        "# ── 7. Distribution plots ─────────────────────────────",
        f"for col in {num_cols[:4]}:",
        "    plt.figure(figsize=(8, 4))",
        "    plt.subplot(1, 2, 1)",
        "    df[col].hist(bins=20, color='#00F5A0', edgecolor='black', alpha=0.7)",
        "    plt.title(f'{col} — Distribution')",
        "    plt.subplot(1, 2, 2)",
        "    stats.probplot(df[col].dropna(), plot=plt)",
        "    plt.tight_layout()",
        "    plt.savefig(f'{col}_distribution.png', dpi=120, bbox_inches='tight')",
        "    plt.close()",
        "",
        "print('\\n✅ Analysis complete. Charts saved to current directory.')",
    ]
    return "\n".join(lines)
