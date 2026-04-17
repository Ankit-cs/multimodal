from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Depends
from fastapi.responses import StreamingResponse
import redis.asyncio as redis
import uuid
import json
import asyncio
import datetime

from src.models.schemas import TaskRequest, ApprovalRequest, ChatRequest
from src.db.database import db_service
from src.services.config import settings
from src.services.team import build_orchestrai_team
from src.services.security import get_current_user

router = APIRouter(prefix="/api/workflow", tags=["Workflow"])

async def run_workflow(session_id: str, prompt: str, resume_feedback: str = None):
    db_state = await db_service.get_state(session_id)
    if not db_state:
        return

    team = build_orchestrai_team(
        is_approved=db_state.get("is_approved", False),
        owner_email=db_state.get("owner_email")
    )

    if db_state.get("autogen_state"):
        def scrub_state(obj):
            if isinstance(obj, str):
                return obj.replace("STATUS: PENDING_APPROVAL", "STATUS: PENDING_APPROVAL (ACKNOWLEDGED)")
            if isinstance(obj, dict):
                return {k: scrub_state(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [scrub_state(i) for i in obj]
            return obj
            
        clean_state = scrub_state(db_state["autogen_state"])
        await team.load_state(clean_state)

    task_input = resume_feedback if resume_feedback else prompt

    def safe_serialize(obj):
        if isinstance(obj, str): return obj
        if isinstance(obj, dict): return {k: safe_serialize(v) for k, v in obj.items()}
        if isinstance(obj, list): return [safe_serialize(i) for i in obj]
        if hasattr(obj, "model_dump"): return obj.model_dump()
        if hasattr(obj, "__dict__"): return safe_serialize(obj.__dict__)
        return str(obj)

    try:
        async for event in team.run_stream(task=task_input):
            if hasattr(event, "source") and hasattr(event, "content"):
                db_state["chat_history"].append({
                    "agent": event.source,
                    "content": safe_serialize(event.content),
                    "type": type(event).__name__,
                })
                await db_service.save_state(db_state)

        is_approved = db_state.get("is_approved", False)
        reviewer_msgs = [m["content"] for m in db_state["chat_history"] if m["agent"] == "Reviewer"]
        pending_request = reviewer_msgs and "STATUS: PENDING_APPROVAL" in str(reviewer_msgs[-1])

        if pending_request and not is_approved:
            db_state["status"] = "PAUSED_FOR_HITL"
        else:
            db_state["status"] = "COMPLETED"

    except Exception as e:
        db_state["status"] = "FAILED"
        db_state["chat_history"].append({
            "agent": "System",
            "content": f"Fatal Error: {str(e)}",
            "type": "error",
        })

    try:
        db_state["autogen_state"] = await team.save_state()
    except Exception:
        pass

    await db_service.save_state(db_state)


@router.post("/start")
async def start_workflow(
    request: TaskRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    session_id = request.session_id or f"ORCH-{str(uuid.uuid4())[:8].upper()}"
    enabled_mcps = getattr(request, "enabled_mcps", [])
    hitl_enabled = getattr(request, "hitl_enabled", True)

    initial_state = {
        "session_id": session_id,
        "status": "ACTIVE",
        "original_prompt": request.prompt,
        "is_approved": False,
        "owner_email": current_user["sub"],
        "chat_history": [
            {"agent": "User", "role": "user", "content": request.prompt}
        ],
        "enabled_mcps": enabled_mcps,
        "hitl_enabled": hitl_enabled,
        "autogen_state": None,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    await db_service.save_state(initial_state)

    background_tasks.add_task(run_workflow, session_id, request.prompt)

    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        msg_payload = {"session_id": session_id, "action": "START", "prompt": request.prompt}
        await redis_client.rpush(settings.REDIS_QUEUE_NAME, json.dumps(msg_payload))
        await redis_client.aclose()
    except Exception as e:
        print(f"Notice: Redis dispatch skipped ({str(e)}). Running locally via BackgroundTasks.")

    return {"session_id": session_id, "status": "Workflow Initialized"}


@router.get("/{session_id}/stream")
async def stream_workflow_status(session_id: str, request: Request, start: int = 0):
    async def event_generator():
        last_message_count = start
        while True:
            if await request.is_disconnected():
                break
            state = await db_service.get_state(session_id)
            if not state:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                break

            current_messages = state.get("chat_history", [])
            status = state.get("status")

            if len(current_messages) > last_message_count or status in ["PAUSED_FOR_HITL", "COMPLETED", "FAILED"]:
                new_msgs = current_messages[last_message_count:]
                last_message_count = len(current_messages)
                payload = {"status": status, "new_logs": new_msgs}
                yield f"data: {json.dumps(payload)}\n\n"

            if status in ["PAUSED_FOR_HITL", "COMPLETED", "FAILED"] and len(current_messages) == last_message_count:
                break
            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/approve")
async def approve_workflow(request: ApprovalRequest, background_tasks: BackgroundTasks):
    state = await db_service.get_state(request.session_id)
    if not state or state["status"] != "PAUSED_FOR_HITL":
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")

    if request.feedback.strip().lower() == "approve":
        state["is_approved"] = True
        state["status"] = "ACTIVE"
        feedback = "Human Approved. Planners/Researchers/Executors: do nothing, pass to Reviewer. Reviewer: YOU MUST NOT output 'STATUS: PENDING_APPROVAL' anymore. Output the final, well-structured, comprehensive markdown summary of the execution for the user. End your message with exactly the single word COMPLETE_WORKFLOW. Finalizer: Please structure the final output."
    else:
        state["is_approved"] = False
        state["status"] = "ACTIVE"
        feedback = f"User Feedback: {request.feedback}"

    await db_service.save_state(state)

    background_tasks.add_task(run_workflow, request.session_id, state.get("original_prompt", ""), feedback)

    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        msg_payload = {"session_id": request.session_id, "action": "RESUME", "feedback": feedback}
        await redis_client.rpush(settings.REDIS_QUEUE_NAME, json.dumps(msg_payload))
        await redis_client.aclose()
    except Exception:
        pass

    return {"status": "Workflow Resumed"}


@router.post("/chat")
async def send_chat_message(request: ChatRequest):
    state = await db_service.get_state(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    state["status"] = "ACTIVE"
    if "chat_history" not in state: state["chat_history"] = []
    state["chat_history"].append({"agent": "User", "role": "user", "content": request.message})
    await db_service.save_state(state)
    
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        msg_payload = {"session_id": request.session_id, "action": "CHAT", "prompt": request.message}
        await redis_client.rpush(settings.REDIS_QUEUE_NAME, json.dumps(msg_payload))
        await redis_client.aclose()
    except Exception:
        pass
        
    return {"status": "Message sent"}


@router.get("/{session_id}")
async def get_workflow_detail(session_id: str):
    state = await db_service.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state


@router.delete("/{session_id}")
async def delete_workflow(session_id: str):
    await db_service.delete_state(session_id)
    return {"status": "success", "session_id": session_id}
