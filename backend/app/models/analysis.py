from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Enum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid, enum
from app.core.database import Base

class AnalysisStatus(str, enum.Enum):
    queued    = "queued"
    running   = "running"
    completed = "completed"
    failed    = "failed"

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id               = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id          = Column(String, ForeignKey("users.id"),   nullable=False)
    dataset_id       = Column(String, ForeignKey("datasets.id"),nullable=False)
    business_problem = Column(Text,   nullable=True)
    analysis_types   = Column(JSON,   default=list)
    status           = Column(Enum(AnalysisStatus), default=AnalysisStatus.queued)
    progress         = Column(Integer, default=0)
    current_step     = Column(String,  default="Queued")
    insights         = Column(JSON,   default=list)
    kpis             = Column(JSON,   default=list)
    charts           = Column(JSON,   default=list)
    sql_queries      = Column(JSON,   default=list)
    python_script    = Column(Text,   default="")
    excel_formulas   = Column(JSON,   default=list)
    recommendations  = Column(JSON,   default=list)
    anomalies        = Column(JSON,   default=list)
    error_msg        = Column(String, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    completed_at     = Column(DateTime(timezone=True), nullable=True)

    user    = relationship("User",    back_populates="analyses")
    dataset = relationship("Dataset", back_populates="analyses")
    reports = relationship("Report",  back_populates="analysis", cascade="all, delete-orphan")
