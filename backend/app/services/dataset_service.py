import io, uuid
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.dataset import Dataset, DatasetStatus
from app.core.config import settings
from loguru import logger


ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}


class DatasetService:

    async def upload(self, file: UploadFile, user_id: str, db: AsyncSession) -> Dataset:
        # Validate
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported file type: {file.content_type}")

        content = await file.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.MAX_UPLOAD_SIZE_MB:
            raise ValueError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

        # Save to disk
        upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / user_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_id   = str(uuid.uuid4())
        file_path = upload_dir / f"{file_id}_{file.filename}"
        file_path.write_bytes(content)

        # Parse with pandas to get schema
        df = self._read_file(content, file.filename or "")
        columns = self._extract_columns(df)

        dataset = Dataset(
            user_id      = user_id,
            name         = file.filename or "dataset",
            file_name    = file.filename or "dataset",
            file_path    = str(file_path),
            file_size    = len(content),
            row_count    = len(df),
            column_count = len(df.columns),
            columns      = columns,
            status       = DatasetStatus.ready,
        )
        db.add(dataset)
        await db.flush()
        logger.info(f"Dataset {dataset.id} uploaded: {len(df)} rows")
        return dataset

    async def get_profile(self, dataset: Dataset) -> dict:
        df = self._load_df(dataset.file_path)
        numeric = df.select_dtypes(include="number")

        stats: dict = {}
        for col in numeric.columns:
            s = df[col].describe()
            stats[col] = {
                "mean": round(float(s["mean"]), 4),
                "std":  round(float(s["std"]),  4),
                "min":  round(float(s["min"]),  4),
                "max":  round(float(s["max"]),  4),
                "q25":  round(float(s["25%"]),  4),
                "q75":  round(float(s["75%"]),  4),
            }

        correlations: dict = {}
        if len(numeric.columns) > 1:
            corr = numeric.corr().round(4)
            correlations = {c: corr[c].to_dict() for c in corr.columns}

        return {
            "row_count":      len(df),
            "column_count":   len(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "column_types":   {c: str(t) for c, t in df.dtypes.items()},
            "statistics":     stats,
            "correlations":   correlations,
            "duplicate_rows": int(df.duplicated().sum()),
        }

    async def get_preview(self, dataset: Dataset, rows: int = 50) -> list[dict]:
        df = self._load_df(dataset.file_path)
        return df.head(rows).fillna("").to_dict(orient="records")

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _read_file(self, content: bytes, filename: str) -> pd.DataFrame:
        buf = io.BytesIO(content)
        if filename.endswith(".csv"):
            return pd.read_csv(buf)
        return pd.read_excel(buf, engine="openpyxl")

    def _load_df(self, path: str) -> pd.DataFrame:
        p = Path(path)
        if p.suffix == ".csv":
            return pd.read_csv(p)
        return pd.read_excel(p, engine="openpyxl")

    def _extract_columns(self, df: pd.DataFrame) -> list[dict]:
        cols = []
        for col in df.columns:
            s = df[col]
            cols.append({
                "name":          col,
                "dtype":         str(s.dtype),
                "null_count":    int(s.isnull().sum()),
                "unique_count":  int(s.nunique()),
                "sample_values": s.dropna().head(5).tolist(),
            })
        return cols


dataset_service = DatasetService()
