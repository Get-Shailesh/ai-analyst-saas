import pytest
import io
import pandas as pd
from unittest.mock import AsyncMock, MagicMock
from app.services.dataset_service import DatasetService

@pytest.fixture
def service():
    return DatasetService()

def test_extract_columns(service):
    df = pd.DataFrame({
        "name":   ["Alice","Bob","Carol"],
        "sales":  [100, 200, 300],
        "active": [True, False, True],
    })
    cols = service._extract_columns(df)
    assert len(cols) == 3
    assert any(c["name"] == "name" for c in cols)
    assert any(c["name"] == "sales" for c in cols)

def test_read_csv(service):
    csv_content = b"a,b,c\n1,2,3\n4,5,6"
    df = service._read_file(csv_content, "test.csv")
    assert len(df) == 2
    assert list(df.columns) == ["a","b","c"]
