"""Standardised API response helpers."""
from typing import Any, Optional

def ok(data: Any, message: str = "Success") -> dict:
    return {"success": True, "message": message, "data": data}

def err(message: str, code: int = 400) -> dict:
    return {"success": False, "message": message, "data": None}
