import pytest
import pandas as pd
import numpy as np
from app.services.analysis_service import (
    _trends, _correlations, _anomalies, _build_kpis, _sql_queries
)

@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "month":    ["Jan","Feb","Mar","Apr","May","Jun"],
        "sales":    [42000, 38000, 35000, 31000, 29000, 27000],
        "customers":[320,   295,   278,   251,   230,   210],
        "churn":    [12,    18,    24,    31,    35,    38],
        "revenue":  [58000, 52000, 47000, 43000, 39000, 36000],
    })

def test_trends_detects_decline(sample_df):
    trends = _trends(sample_df, "")
    sales_trend = next(t for t in trends if t["column"] == "sales")
    assert sales_trend["direction"] == "down"
    assert sales_trend["slope"] < 0
    assert sales_trend["r2"] > 0.95

def test_correlations_returns_matrix(sample_df):
    corr = _correlations(sample_df, "")
    assert "sales" in corr
    assert "customers" in corr
    assert abs(corr["sales"]["customers"]) > 0.9

def test_anomalies_on_normal_data(sample_df):
    anomalies = _anomalies(sample_df, "")
    assert isinstance(anomalies, list)

def test_anomalies_detects_spike():
    df = pd.DataFrame({ "value": [100, 102, 98, 101, 5000, 99, 103] })
    anomalies = _anomalies(df, "")
    assert len(anomalies) >= 1
    assert any(a["value"] == 5000 for a in anomalies)

def test_kpis_built_from_numeric(sample_df):
    kpis = _build_kpis(sample_df)
    assert len(kpis) > 0
    assert all("label" in k and "value" in k for k in kpis)

def test_sql_queries_generated(sample_df):
    queries = _sql_queries(sample_df, "Why is revenue dropping?")
    assert len(queries) == 3
    assert all("sql" in q and "title" in q for q in queries)
