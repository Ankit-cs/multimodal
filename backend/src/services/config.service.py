# Loads environment variables
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Groq API Configuration
    GROQ_API_KEY_1: str
    GROQ_MODEL_1: str = "openai/gpt-oss-20b"
    GROQ_API_KEY_2: str
    GROQ_MODEL_2: str = "llama-3.3-70b-versatile"
    FINALIZER_MODEL: str = "qwen/qwen3-32b"         
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    SERPER_API_KEY: str = ""                        
    
    # Gemini API Configuration for Fugu Orchestration
    GEMINI_API_KEY_PLANNER: str
    GEMINI_API_KEY_RESEARCHER: str
    GEMINI_API_KEY_EXECUTOR: str
    GEMINI_API_KEY_REVIEWER: str
    GEMINI_MODEL: str = "gemini-1.5-pro-latest"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    
    # Azure Phi-4 LLM (optional - not required for core workflow)
    PHI4_API_KEY: Optional[str] = None
    PHI4_ENDPOINT: Optional[str] = None
    PHI4_TARGET_URI: Optional[str] = None
    PHI4_MODEL: str = "phi-4"
    
    # JWT Auth
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # MongoDB Infrastructure
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_DATABASE: str = "NexusAldb"
    MONGO_DB_CONTAINER: str = "workflow_states"
    
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_QUEUE_NAME: str = "agent-tasks"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"

    # Spotify MCP
    SPOTIFY_CLIENT_ID: str = ""
    SPOTIFY_CLIENT_SECRET: str = ""

    # Brevo Email
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = "ankitcareer018@gmail.com" # Don't forget to change this!
    BREVO_SENDER_NAME: str = "NexusAl Agent"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()


