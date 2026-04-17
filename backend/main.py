from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db.database import db_service
from src.services.config import settings

from src.routes.auth_routes import router as auth_router
from src.routes.mcp_routes import router as mcp_router
from src.routes.user_routes import router as user_router
from src.routes.workflow_routes import router as workflow_router

app = FastAPI(title="NexusAl API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await db_service.init_db()
    
    if settings.SPOTIFY_CLIENT_ID and settings.SPOTIFY_CLIENT_SECRET:
        configs = await db_service.get_mcp_configs()
        if not any(c.get("service") == "spotify" for c in configs):
            await db_service.save_mcp_config({
                "id": "mcp-spotify-default",
                "name": "Spotify Music",
                "service": "spotify",
                "config": {
                    "client_id": settings.SPOTIFY_CLIENT_ID,
                    "client_secret": settings.SPOTIFY_CLIENT_SECRET
                },
                "is_active": True
            })

    if settings.SERPER_API_KEY:
        configs = await db_service.get_mcp_configs()
        if not any(c.get("service") == "serper" for c in configs):
            await db_service.save_mcp_config({
                "id": "mcp-serper-default",
                "name": "Google Search (Serper)",
                "service": "serper",
                "config": {
                    "api_key": settings.SERPER_API_KEY
                },
                "is_active": True
            })

# Register Routers
app.include_router(auth_router)
app.include_router(mcp_router)
app.include_router(user_router)
app.include_router(workflow_router)
