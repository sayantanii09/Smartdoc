import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import ValidationError

# Security configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()

class AuthHandler:
    def __init__(self):
        self.pwd_context = pwd_context
        self.secret = JWT_SECRET_KEY
        self.algorithm = JWT_ALGORITHM

    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def encode_token(self, user_id: str, username: str) -> str:
        """Create a JWT token"""
        payload = {
            'exp': datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
            'iat': datetime.utcnow(),
            'sub': user_id,
            'username': username,
            'type': 'access'
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        """Decode and verify a JWT token"""
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            if payload.get('type') != 'access':
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail='Invalid token type'
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Token has expired'
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token'
            )

    def get_current_user_id(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
        """Extract user ID from JWT token"""
        token = credentials.credentials
        payload = self.decode_token(token)
        return payload['sub']

    def get_current_username(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
        """Extract username from JWT token"""
        token = credentials.credentials
        payload = self.decode_token(token)
        return payload['username']

# Create auth handler instance
auth_handler = AuthHandler()

# Dependency functions
def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency to get current user ID"""
    return auth_handler.get_current_user_id(credentials)

def get_current_username(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency to get current username"""
    return auth_handler.get_current_username(credentials)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current user object"""
    from .database import user_db
    
    user_id = auth_handler.get_current_user_id(credentials)
    user = await user_db.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user

# Utility functions
def validate_password_strength(password: str) -> bool:
    """Validate password meets security requirements"""
    if len(password) < 6:
        return False
    
    # Add more password complexity rules as needed
    # has_upper = any(c.isupper() for c in password)
    # has_lower = any(c.islower() for c in password)
    # has_digit = any(c.isdigit() for c in password)
    # has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    return True

def create_access_token(user_id: str, username: str) -> str:
    """Create access token for user"""
    return auth_handler.encode_token(user_id, username)