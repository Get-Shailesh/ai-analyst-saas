"""Anomaly detection using multiple statistical methods."""
import numpy as np
import pandas as pd
from scipy import stats
from dataclasses import dataclass
from typing import Literal

@dataclass
class Anomaly:
    column: str
    row_index: int
    value: float
    z_score: float
    method: str
    severity: Literal["low", "medium", "high"]

def detect_zscore(df: pd.DataFrame, threshold: float = 2.5) -> list[Anomaly]:
    anomalies: list[Anomaly] = []
    numeric = df.select_dtypes(include="number")
    for col in numeric.columns:
        s = numeric[col].dropna()
        if len(s) < 4:
            continue
        z = np.abs(stats.zscore(s))
        for idx in np.where(z > threshold)[0]:
            severity = "high" if z[idx] > 3.5 else ("medium" if z[idx] > 3.0 else "low")
            anomalies.append(Anomaly(
                column=col, row_index=int(idx),
                value=round(float(s.iloc[idx]), 4),
                z_score=round(float(z[idx]), 3),
                method="zscore", severity=severity,
            ))
    return anomalies

def detect_iqr(df: pd.DataFrame, multiplier: float = 1.5) -> list[Anomaly]:
    anomalies: list[Anomaly] = []
    numeric = df.select_dtypes(include="number")
    for col in numeric.columns:
        s = numeric[col].dropna()
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - multiplier * iqr, q3 + multiplier * iqr
        outliers = s[(s < lower) | (s > upper)]
        for idx, val in outliers.items():
            anomalies.append(Anomaly(
                column=col, row_index=int(idx),  # type: ignore
                value=round(float(val), 4), z_score=0.0,
                method="iqr", severity="medium",
            ))
    return anomalies
