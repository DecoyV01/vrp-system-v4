"""
JWT Authentication Middleware using Supabase Auth validation
"""

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
import os
from typing import Optional

from ..database.connection import get_supabase

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

class CurrentUser:
    def __init__(self, user_id: str, email: str, metadata: dict):
        self.user_id = user_id
        self.email = email
        self.metadata = metadata

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> CurrentUser:
    token = credentials.credentials
    
    try:
        # Use Supabase built-in user validation
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = response.user
        return CurrentUser(
            user_id=user.id,
            email=user.email or "",
            metadata=user.user_metadata or {}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    supabase: Client = Depends(get_supabase)
) -> Optional[CurrentUser]:
    """
    Optional authentication for endpoints that work with or without authentication
    """
    if not credentials:
        return None
    
    try:
        response = supabase.auth.get_user(credentials.credentials)
        
        if not response.user:
            return None
        
        user = response.user
        return CurrentUser(
            user_id=user.id,
            email=user.email or "",
            metadata=user.user_metadata or {}
        )
        
    except Exception:
        return None
