# backend/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from src.services.config import settings
import datetime
import numpy as np

class MongoDBService:
    def __init__(self):
        mongo_uri = getattr(settings, "MONGO_URI", "mongodb://localhost:27017")
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db_name = getattr(settings, "MONGO_DB_DATABASE", "NexusAldb")
        self.container_name = getattr(settings, "MONGO_DB_CONTAINER", "workflow_states")
        
        self.db = None
        self.container = None
        self.vector_container = None
        self.mcp_container = None
        self.calendar_container = None
        self.users_container = None

    async def init_db(self):
        print(f"DEBUG: Initializing MongoDB connection")
        self.db = self.client[self.db_name]
        self.container = self.db[self.container_name]
        self.vector_container = self.db["document_chunks"]
        self.mcp_container = self.db["mcp_configs"]
        self.calendar_container = self.db["calendar_events"]
        self.users_container = self.db["users"]
        
        await self.container.create_index("session_id")
        await self.users_container.create_index("email", unique=True)
        print("DEBUG: MongoDB collections ready.")

    def _clean_id(self, doc):
        if doc and "_id" in doc:
            del doc["_id"]
        return doc

    # --- CORE WORKFLOW STATE METHODS ---
    async def save_state(self, state_dict: dict):
        state_dict["updated_at"] = datetime.datetime.utcnow().isoformat()
        state_dict["id"] = state_dict.get("session_id")
        await self.container.update_one(
            {"session_id": state_dict["session_id"]}, 
            {"$set": state_dict}, 
            upsert=True
        )

    async def get_state(self, session_id: str) -> dict:
        doc = await self.container.find_one({"$or": [{"id": session_id}, {"session_id": session_id}]})
        return self._clean_id(doc)

    async def delete_state(self, session_id: str):
        query = {"$or": [{"id": session_id}, {"session_id": session_id}]}
        await self.container.delete_one(query)

    # --- USER PROFILE & HISTORY METHODS ---
    async def get_all_workflows(self, email: str = None):
        query = {"owner_email": email} if email else {}
        cursor = self.container.find(query).sort("created_at", -1)
        results = await cursor.to_list(length=None)
        return [self._clean_id(doc) for doc in results]

    async def get_recent_logs(self, email: str = None):
        query = {"chat_history": {"$exists": True}}
        if email:
            query["owner_email"] = email
        cursor = self.container.find(query, {"session_id": 1, "chat_history": 1, "created_at": 1}).sort("created_at", -1).limit(10)
        results = await cursor.to_list(length=None)
        return [self._clean_id(doc) for doc in results]

    async def get_user_profile(self, email: str) -> dict:
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return {"full_name": "", "role": "", "bio": "", "skills": [], "socials": {}, "email": email}
            return {
                "email":     user.get("email", email),
                "full_name": user.get("full_name", user.get("name", "")),
                "role":      user.get("role", ""),
                "bio":       user.get("bio", ""),
                "skills":    user.get("skills", []),
                "socials":   user.get("socials", {"github": "", "linkedin": "", "twitter": "", "website": ""}),
            }
        except Exception as e:
            print(f"Error fetching profile for {email}: {e}")
            return {"full_name": "", "role": "", "bio": "", "skills": [], "socials": {}, "email": email}

    async def save_user_profile(self, email: str, profile_data: dict):
        user = await self.get_user_by_email(email)
        if not user:
            raise ValueError(f"No user found with email: {email}")
        updates = {
            "full_name": profile_data.get("full_name", user.get("full_name", "")),
            "role": profile_data.get("role", user.get("role", "")),
            "bio": profile_data.get("bio", user.get("bio", "")),
            "skills": profile_data.get("skills", user.get("skills", [])),
            "socials": profile_data.get("socials", user.get("socials", {}))
        }
        await self.users_container.update_one({"email": email}, {"$set": updates})

    async def get_recent_sessions(self, limit: int = None) -> list:
        cursor = self.container.find({})
        results = []
        async for item in cursor:
            prompt = item.get("original_prompt")
            if not prompt and item.get("chat_history") and isinstance(item["chat_history"], list) and len(item["chat_history"]) > 0:
                prompt = item["chat_history"][0].get("content")
            if not prompt:
                prompt = "New Session"
            results.append({
                "session_id": item.get("session_id") or item.get("id"),
                "status": item.get("status", "ACTIVE"),
                "updated_at": item.get("updated_at", ""),
                "initial_prompt": prompt
            })
        results.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        if limit is not None:
            return results[:limit]
        return results

    # --- MCP CONFIGURATION METHODS ---
    async def save_mcp_config(self, config: dict):
        if "id" in config:
            await self.mcp_container.update_one({"id": config["id"]}, {"$set": config}, upsert=True)
        else:
            await self.mcp_container.insert_one(config)

    async def get_mcp_configs(self) -> list:
        cursor = self.mcp_container.find({"is_active": True})
        results = await cursor.to_list(length=None)
        return [self._clean_id(doc) for doc in results]
    
    async def get_mcp_config(self, mcp_id: str) -> dict:
        doc = await self.mcp_container.find_one({"id": mcp_id})
        return self._clean_id(doc)

    async def delete_mcp_config(self, mcp_id: str):
        await self.mcp_container.delete_one({"id": mcp_id})

    # --- USER AUTH METHODS ---
    async def save_user(self, user_dict: dict):
        email = user_dict.get("email")
        if email:
            await self.users_container.update_one({"email": email}, {"$set": user_dict}, upsert=True)
        else:
            await self.users_container.insert_one(user_dict)

    async def get_user_by_email(self, email: str) -> dict:
        try:
            doc = await self.users_container.find_one({"email": email})
            return self._clean_id(doc)
        except Exception as e:
            print(f"Error looking up user by email '{email}': {e}")
        return None

    # --- CALENDAR METHODS ---
    async def save_calendar_event(self, event: dict):
        if "created_at" not in event:
            event["created_at"] = datetime.datetime.utcnow().isoformat()
        if "type" not in event:
            event["type"] = "MEETING"
            
        event_id = event.get("id")
        if event_id:
             await self.calendar_container.update_one({"id": event_id}, {"$set": event}, upsert=True)
        else:
             await self.calendar_container.insert_one(event)

    async def get_calendar_events(self, email: str = None) -> list:
        query = {"owner_email": email} if email else {}
        cursor = self.calendar_container.find(query).sort("start_time", 1)
        results = await cursor.to_list(length=None)
        return [self._clean_id(doc) for doc in results]

    # --- VECTOR EMBEDDING / RAG METHODS ---
    async def save_chunk(self, session_id: str, chunk_id: str, text: str, embedding: list, metadata: dict = None):
        if metadata is None: metadata = {}
        item = {
            "id": f"{session_id}_{chunk_id}",
            "session_id": session_id,
            "text": text,
            "embedding": embedding,
            "metadata": metadata
        }
        await self.vector_container.update_one({"id": item["id"]}, {"$set": item}, upsert=True)

    async def search_chunks(self, session_id: str, query_embedding: list, top_k: int = 5) -> list:
        cursor = self.vector_container.find({"session_id": session_id})
        results = []
        async for item in cursor:
            e1 = np.array(item.get('embedding', []))
            e2 = np.array(query_embedding)
            norm1, norm2 = np.linalg.norm(e1), np.linalg.norm(e2)
            sim = float(np.dot(e1, e2) / (norm1 * norm2)) if norm1 and norm2 else 0.0
            item['similarity_score'] = sim
            results.append(item)
            
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return [self._clean_id(doc) for doc in results[:top_k]]

db_service = MongoDBService()
