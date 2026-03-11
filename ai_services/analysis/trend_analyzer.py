"""Statistical trend analysis utilities."""
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from dataclasses import dataclass
from typing import Literal

@dataclass
class TrendResult:
    column: str
    direction: Literal["up", "down", "flat"]
    slope: float
    r2: float
    pct_change_total: float
    is_significant: bool  # r2 > 0.7

def analyse_trends(df: pd.DataFrame) -> list[TrendResult]:
    results: list[TrendResult] = []
    numeric = df.select_dtypes(include="number")
    for col in numeric.columns:
        s = numeric[col].dropna()
        if len(s) < 3:
            continue
        x = np.arange(len(s)).reshape(-1, 1)
        model = LinearRegression().fit(x, s)
        slope = float(model.coef_[0])
        r2    = float(model.score(x, s))
        pct   = float((s.iloc[-1] - s.iloc[0]) / s.iloc[0] * 100) if s.iloc[0] != 0 else 0.0
        direction = "up" if slope > 0.01 * s.mean() else ("down" if slope < -0.01 * s.mean() else "flat")
        results.append(TrendResult(
            column=col, direction=direction,
            slope=round(slope, 4), r2=round(r2, 4),
            pct_change_total=round(pct, 2),
            is_significant=r2 > 0.7,
        ))
    return results

def detect_seasonality(series: pd.Series, period: int = 12) -> bool:
    """Simple autocorrelation-based seasonality check."""
    if len(series) < period * 2:
        return False
    autocorr = series.autocorr(lag=period)
    return bool(autocorr > 0.5)
