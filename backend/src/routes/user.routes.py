from fastapi import APIRouter, HTTPException, Depends
from src.models.schemas import ProfileUpdateRequest
from src.db.database import db_service
from src.services.security import get_current_user

router = APIRouter(prefix="/api", tags=["User"])

@router.get("/calendar")
async def get_calendar_events(current_user: dict = Depends(get_current_user)):
    email = current_user["sub"]
    events = await db_service.get_calendar_events(email=email)
    return {"events": events}

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    email = current_user["sub"]
    workflows = await db_service.get_all_workflows(email=email)
    return {"tasks": workflows}

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    email = current_user["sub"]
    return await db_service.get_user_profile(email)

@router.put("/profile")
async def update_profile(
    profile: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    email = current_user["sub"]
    try:
        await db_service.save_user_profile(email, profile.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return await db_service.get_user_profile(email)

@router.get("/logs/recent")
async def get_recent_global_logs(current_user: dict = Depends(get_current_user)):
    email = current_user["sub"]
    recent_runs = await db_service.get_recent_logs(email=email)
    global_logs = []
    for run in recent_runs:
        for msg in run.get("chat_history", []):
            global_logs.append({
                "session_id": run.get("session_id"),
                "agent": msg.get("agent"),
                "content": msg.get("content"),
                "type": msg.get("type"),
            })
    return {"logs": global_logs}
