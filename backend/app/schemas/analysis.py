from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class AnalysisRequest(BaseModel):
    dataset_id:       str
    business_problem: str = ""
    analysis_types:   List[str] = ["descriptive", "diagnostic", "anomaly"]
    depth:            str = "standard"

class InsightSchema(BaseModel):
    id:              str
    severity:        str
    title:           str
    detail:          str
    supporting_data: Any = None
    confidence:      float = 0.9
    action:          str

class KPISchema(BaseModel):
    label:       str
    value:       Any
    change:      float
    trend:       str
    is_positive: bool
    icon:        str
    description: str

class AnalysisStatusResponse(BaseModel):
    id:           str
    status:       str
    progress:     int
    current_step: str

class AnalysisResponse(BaseModel):
    id:              str
    dataset_id:      str
    status:          str
    progress:        int
    insights:        List[InsightSchema]    = []
    kpis:            List[KPISchema]        = []
    sql_queries:     List[Dict[str, Any]]   = []
    python_script:   str = ""
    excel_formulas:  List[Dict[str, Any]]   = []
    recommendations: List[Dict[str, Any]]   = []
    anomalies:       List[Dict[str, Any]]   = []
    created_at:      datetime
    completed_at:    Optional[datetime] = None

    model_config = {"from_attributes": True}
