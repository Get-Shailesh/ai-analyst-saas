"""File validation utilities."""
import magic
from pathlib import Path

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

def validate_file_extension(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def validate_mime_type(content: bytes) -> bool:
    try:
        mime = magic.from_buffer(content[:2048], mime=True)
        return mime in ALLOWED_MIME_TYPES
    except Exception:
        return True  # fallback: allow if magic fails

def validate_file_size(size_bytes: int, max_mb: int = 100) -> bool:
    return size_bytes <= max_mb * 1024 * 1024
