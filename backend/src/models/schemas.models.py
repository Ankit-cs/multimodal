# Pydantic models for data validation
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TaskRequest(BaseModel):
    prompt: str = Field(..., description="The user's high-level objective")
    session_id: Optional[str] = None
    enabled_mcps: Optional[List[str]] = None
    hitl_enabled: bool = Field(default=True, description="Whether to require human-in-the-loop approval")

class WorkflowState(BaseModel):
    session_id: str
    status: str = Field(default="PENDING", description="PENDING, ACTIVE, PAUSED_FOR_HITL, COMPLETED, FAILED")
    is_approved: bool = Field(default=False, description="Whether the human has approved the payload to run to completion")
    original_prompt: str
    autogen_state: Optional[Dict[str, Any]] = Field(default=None, description="Serialized AutoGen team state")
    chat_history: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str
    enabled_mcps: List[str] = []
    hitl_enabled: bool = True

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    feedback: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str

# Your custom profile model (kept intact)
class UserProfile(BaseModel):
    user_id: str = "default_user" # Hardcoded for MVP, link to Entra ID later
    full_name: str
    github_username: str
    github_url: str
    bio: str
    skills: List[str]


# ── Auth Schemas ─────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, description="User's display name")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Must be at least 8 characters")

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthUserResponse(BaseModel):
    """Safe user object returned to the client — never includes the password hash."""
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


# ── Profile Schemas ───────────────────────────────────────────────────────────

class SocialsData(BaseModel):
    """Social/web presence links — all optional."""
    github: str = ""
    linkedin: str = ""
    twitter: str = ""
    website: str = ""

class ProfileUpdateRequest(BaseModel):
    """
    Fields from Profile.jsx that the user is allowed to change.
    Email is intentionally excluded here — it comes from the JWT and is read-only.
    """
    full_name: str = Field(..., min_length=1)
    role: str = ""
    bio: str = ""
    skills: List[str] = []
    socials: SocialsData = SocialsData()

# Pydantic models for data validation
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TaskRequest(BaseModel):
    prompt: str = Field(..., description="The user's high-level objective")
    session_id: Optional[str] = None
    enabled_mcps: Optional[List[str]] = None
    hitl_enabled: bool = Field(default=True, description="Whether to require human-in-the-loop approval")

class WorkflowState(BaseModel):
    session_id: str
    status: str = Field(default="PENDING", description="PENDING, ACTIVE, PAUSED_FOR_HITL, COMPLETED, FAILED")
    is_approved: bool = Field(default=False, description="Whether the human has approved the payload to run to completion")
    original_prompt: str
    autogen_state: Optional[Dict[str, Any]] = Field(default=None, description="Serialized AutoGen team state")
    chat_history: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str
    enabled_mcps: List[str] = []
    hitl_enabled: bool = True

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    feedback: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str

# Your custom profile model (kept intact)
class UserProfile(BaseModel):
    user_id: str = "default_user" # Hardcoded for MVP, link to Entra ID later
    full_name: str
    github_username: str
    github_url: str
    bio: str
    skills: List[str]


# ── Auth Schemas ─────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, description="User's display name")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Must be at least 8 characters")

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthUserResponse(BaseModel):
    """Safe user object returned to the client — never includes the password hash."""
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


# ── Profile Schemas ───────────────────────────────────────────────────────────

class SocialsData(BaseModel):
    """Social/web presence links — all optional."""
    github: str = ""
    linkedin: str = ""
    twitter: str = ""
    website: str = ""

class ProfileUpdateRequest(BaseModel):
    """
    Fields from Profile.jsx that the user is allowed to change.
    Email is intentionally excluded here — it comes from the JWT and is read-only.
    """
    full_name: str = Field(..., min_length=1)
    role: str = ""
    bio: str = ""
    skills: List[str] = []
    socials: SocialsData = SocialsData()
