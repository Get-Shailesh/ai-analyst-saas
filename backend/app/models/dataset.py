from sqlalchemy import Column, String, Integer, BigInteger, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid, enum
from app.core.database import Base

class DatasetStatus(str, enum.Enum):
    uploading  = "uploading"
    processing = "processing"
    ready      = "ready"
    error      = "error"

class Dataset(Base):
    __tablename__ = "datasets"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    name         = Column(String, nullable=False)
    file_name    = Column(String, nullable=False)
    file_path    = Column(String, nullable=False)
    file_size    = Column(BigInteger, default=0)
    row_count    = Column(Integer,   default=0)
    column_count = Column(Integer,   default=0)
    columns      = Column(JSON,      default=list)
    profile      = Column(JSON,      default=dict)
    status       = Column(Enum(DatasetStatus), default=DatasetStatus.uploading)
    error_msg    = Column(String,    nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user     = relationship("User",           back_populates="datasets")
    analyses = relationship("AnalysisResult", back_populates="dataset", cascade="all, delete-orphan")
