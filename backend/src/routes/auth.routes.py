from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from src.models.schemas import SignupRequest, LoginRequest, TokenResponse
from src.db.database import db_service
from src.services.security import hash_password, verify_password, create_access_token, get_current_user
import datetime

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", status_code=201)
async def signup(request: SignupRequest):
    existing = await db_service.get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with that email address already exists."
        )

    new_user = {
        "id": request.email,
        "email": request.email,
        "name": request.name,
        "password_hash": hash_password(request.password),
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    await db_service.save_user(new_user)
    return {"message": "Account created successfully. Please log in."}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await db_service.get_user_by_email(request.email)

    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token_payload = {
        "sub": user["email"],
        "name": user["name"],
        "id": user["id"],
    }
    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"],
        },
    }

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully. Please delete your local token."}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user.get("id"),
        "name": current_user.get("name"),
        "email": current_user.get("sub"),
    }
