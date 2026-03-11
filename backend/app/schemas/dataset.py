from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class ColumnSchema(BaseModel):
    name:         str
    dtype:        str
    null_count:   int = 0
    unique_count: int = 0
    sample_values:List[Any] = []

class DatasetResponse(BaseModel):
    id:           str
    name:         str
    file_name:    str
    file_size:    int
    row_count:    int
    column_count: int
    columns:      List[ColumnSchema] = []
    status:       str
    created_at:   datetime

    model_config = {"from_attributes": True}

class DatasetProfileResponse(BaseModel):
    row_count:      int
    column_count:   int
    missing_values: Dict[str, int]
    column_types:   Dict[str, str]
    statistics:     Dict[str, Any]
    correlations:   Dict[str, Dict[str, float]]
    duplicate_rows: int
