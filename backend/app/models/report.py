from sqlalchemy import Column, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid, enum
from app.core.database import Base

class ReportFormat(str, enum.Enum):
    pdf   = "pdf"
    pptx  = "pptx"
    excel = "excel"
    json  = "json"

class ReportStatus(str, enum.Enum):
    generating = "generating"
    ready      = "ready"
    error      = "error"

class Report(Base):
    __tablename__ = "reports"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id  = Column(String, ForeignKey("analysis_results.id"), nullable=False)
    format       = Column(Enum(ReportFormat), nullable=False)
    status       = Column(Enum(ReportStatus), default=ReportStatus.generating)
    file_path    = Column(String, nullable=True)
    download_url = Column(String, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    analysis = relationship("AnalysisResult", back_populates="reports")
