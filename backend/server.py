from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# User & Session Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Profile Model
class Profile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str = "خالد جاسم"
    title: str = "DBA + Strategist + AI Specialist"
    photo: Optional[str] = None  # base64
    summary: str = ""
    vision: str = ""
    mission: str = ""
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[str] = None
    photo: Optional[str] = None
    summary: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None

# Experience Model
class Experience(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company: str
    position: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    description: str = ""
    location: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExperienceCreate(BaseModel):
    company: str
    position: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    description: str = ""
    location: Optional[str] = None
    order: int = 0

# Education Model
class Education(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution: str
    degree: str
    field: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    description: str = ""
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EducationCreate(BaseModel):
    institution: str
    degree: str
    field: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    description: str = ""
    order: int = 0

# Skill Model
class Skill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # technical, administrative, soft
    level: int = 80  # percentage 0-100
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SkillCreate(BaseModel):
    name: str
    category: str
    level: int = 80
    order: int = 0

# Research Model
class Research(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    abstract: str = ""
    publication_date: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_base64: Optional[str] = None
    keywords: List[str] = []
    status: str = "published"  # published, under_review, draft
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResearchCreate(BaseModel):
    title: str
    abstract: str = ""
    publication_date: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_base64: Optional[str] = None
    keywords: List[str] = []
    status: str = "published"
    order: int = 0

# Book Model
class Book(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    cover_image: Optional[str] = None  # base64
    publication_date: Optional[str] = None
    publisher: Optional[str] = None
    purchase_url: Optional[str] = None
    download_url: Optional[str] = None
    page_count: Optional[int] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookCreate(BaseModel):
    title: str
    description: str = ""
    cover_image: Optional[str] = None
    publication_date: Optional[str] = None
    publisher: Optional[str] = None
    purchase_url: Optional[str] = None
    download_url: Optional[str] = None
    page_count: Optional[int] = None
    order: int = 0

# Project Model
class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    image: Optional[str] = None  # base64
    url: Optional[str] = None
    technologies: List[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    image: Optional[str] = None
    url: Optional[str] = None
    technologies: List[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    order: int = 0

# Award Model
class Award(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    issuer: str = ""
    date: Optional[str] = None
    description: str = ""
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AwardCreate(BaseModel):
    title: str
    issuer: str = ""
    date: Optional[str] = None
    description: str = ""
    order: int = 0

# Certificate Model
class Certificate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    issuer: str
    date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CertificateCreate(BaseModel):
    title: str
    issuer: str
    date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    order: int = 0

# Social Link Model
class SocialLink(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str  # linkedin, twitter, github, email, phone, website
    url: str
    icon: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SocialLinkCreate(BaseModel):
    platform: str
    url: str
    icon: Optional[str] = None
    order: int = 0

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        return None
    
    return User(**user)

async def require_admin(request: Request) -> User:
    """Require admin authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=500, detail="Authentication service error")
    
    user_email = auth_data.get("email")
    user_name = auth_data.get("name")
    user_picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_name, "picture": user_picture}}
        )
    else:
        # Create new user (first user is admin)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_email,
            "name": user_name,
            "picture": user_picture,
            "is_admin": True,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.dict()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============== PROFILE ROUTES ==============

@api_router.get("/profile")
async def get_profile():
    """Get public profile"""
    profile = await db.profile.find_one({}, {"_id": 0})
    if not profile:
        # Return default profile
        return Profile().dict()
    return profile

@api_router.put("/profile")
async def update_profile(update: ProfileUpdate, request: Request):
    """Update profile (admin only)"""
    await require_admin(request)
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    existing = await db.profile.find_one({})
    if existing:
        await db.profile.update_one({}, {"$set": update_data})
    else:
        profile = Profile(**update_data)
        await db.profile.insert_one(profile.dict())
    
    return await db.profile.find_one({}, {"_id": 0})

# ============== EXPERIENCE ROUTES ==============

@api_router.get("/experiences", response_model=List[Experience])
async def get_experiences():
    """Get all experiences"""
    experiences = await db.experiences.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return experiences

@api_router.post("/experiences", response_model=Experience)
async def create_experience(data: ExperienceCreate, request: Request):
    """Create experience (admin only)"""
    await require_admin(request)
    experience = Experience(**data.dict())
    await db.experiences.insert_one(experience.dict())
    return experience

@api_router.put("/experiences/{id}", response_model=Experience)
async def update_experience(id: str, data: ExperienceCreate, request: Request):
    """Update experience (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.experiences.update_one({"id": id}, {"$set": update_data})
    updated = await db.experiences.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Experience not found")
    return Experience(**updated)

@api_router.delete("/experiences/{id}")
async def delete_experience(id: str, request: Request):
    """Delete experience (admin only)"""
    await require_admin(request)
    result = await db.experiences.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    return {"message": "Deleted"}

# ============== EDUCATION ROUTES ==============

@api_router.get("/education", response_model=List[Education])
async def get_education():
    """Get all education"""
    education = await db.education.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return education

@api_router.post("/education", response_model=Education)
async def create_education(data: EducationCreate, request: Request):
    """Create education (admin only)"""
    await require_admin(request)
    education = Education(**data.dict())
    await db.education.insert_one(education.dict())
    return education

@api_router.put("/education/{id}", response_model=Education)
async def update_education(id: str, data: EducationCreate, request: Request):
    """Update education (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.education.update_one({"id": id}, {"$set": update_data})
    updated = await db.education.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Education not found")
    return Education(**updated)

@api_router.delete("/education/{id}")
async def delete_education(id: str, request: Request):
    """Delete education (admin only)"""
    await require_admin(request)
    result = await db.education.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Education not found")
    return {"message": "Deleted"}

# ============== SKILLS ROUTES ==============

@api_router.get("/skills", response_model=List[Skill])
async def get_skills():
    """Get all skills"""
    skills = await db.skills.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return skills

@api_router.post("/skills", response_model=Skill)
async def create_skill(data: SkillCreate, request: Request):
    """Create skill (admin only)"""
    await require_admin(request)
    skill = Skill(**data.dict())
    await db.skills.insert_one(skill.dict())
    return skill

@api_router.put("/skills/{id}", response_model=Skill)
async def update_skill(id: str, data: SkillCreate, request: Request):
    """Update skill (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.skills.update_one({"id": id}, {"$set": update_data})
    updated = await db.skills.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Skill not found")
    return Skill(**updated)

@api_router.delete("/skills/{id}")
async def delete_skill(id: str, request: Request):
    """Delete skill (admin only)"""
    await require_admin(request)
    result = await db.skills.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"message": "Deleted"}

# ============== RESEARCH ROUTES ==============

@api_router.get("/research", response_model=List[Research])
async def get_research():
    """Get all research"""
    research = await db.research.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return research

@api_router.post("/research", response_model=Research)
async def create_research(data: ResearchCreate, request: Request):
    """Create research (admin only)"""
    await require_admin(request)
    research = Research(**data.dict())
    await db.research.insert_one(research.dict())
    return research

@api_router.put("/research/{id}", response_model=Research)
async def update_research(id: str, data: ResearchCreate, request: Request):
    """Update research (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.research.update_one({"id": id}, {"$set": update_data})
    updated = await db.research.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Research not found")
    return Research(**updated)

@api_router.delete("/research/{id}")
async def delete_research(id: str, request: Request):
    """Delete research (admin only)"""
    await require_admin(request)
    result = await db.research.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Research not found")
    return {"message": "Deleted"}

# ============== BOOKS ROUTES ==============

@api_router.get("/books", response_model=List[Book])
async def get_books():
    """Get all books"""
    books = await db.books.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return books

@api_router.post("/books", response_model=Book)
async def create_book(data: BookCreate, request: Request):
    """Create book (admin only)"""
    await require_admin(request)
    book = Book(**data.dict())
    await db.books.insert_one(book.dict())
    return book

@api_router.put("/books/{id}", response_model=Book)
async def update_book(id: str, data: BookCreate, request: Request):
    """Update book (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.books.update_one({"id": id}, {"$set": update_data})
    updated = await db.books.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Book not found")
    return Book(**updated)

@api_router.delete("/books/{id}")
async def delete_book(id: str, request: Request):
    """Delete book (admin only)"""
    await require_admin(request)
    result = await db.books.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Deleted"}

# ============== PROJECTS ROUTES ==============

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    """Get all projects"""
    projects = await db.projects.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return projects

@api_router.post("/projects", response_model=Project)
async def create_project(data: ProjectCreate, request: Request):
    """Create project (admin only)"""
    await require_admin(request)
    project = Project(**data.dict())
    await db.projects.insert_one(project.dict())
    return project

@api_router.put("/projects/{id}", response_model=Project)
async def update_project(id: str, data: ProjectCreate, request: Request):
    """Update project (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.projects.update_one({"id": id}, {"$set": update_data})
    updated = await db.projects.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**updated)

@api_router.delete("/projects/{id}")
async def delete_project(id: str, request: Request):
    """Delete project (admin only)"""
    await require_admin(request)
    result = await db.projects.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Deleted"}

# ============== AWARDS ROUTES ==============

@api_router.get("/awards", response_model=List[Award])
async def get_awards():
    """Get all awards"""
    awards = await db.awards.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return awards

@api_router.post("/awards", response_model=Award)
async def create_award(data: AwardCreate, request: Request):
    """Create award (admin only)"""
    await require_admin(request)
    award = Award(**data.dict())
    await db.awards.insert_one(award.dict())
    return award

@api_router.put("/awards/{id}", response_model=Award)
async def update_award(id: str, data: AwardCreate, request: Request):
    """Update award (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.awards.update_one({"id": id}, {"$set": update_data})
    updated = await db.awards.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Award not found")
    return Award(**updated)

@api_router.delete("/awards/{id}")
async def delete_award(id: str, request: Request):
    """Delete award (admin only)"""
    await require_admin(request)
    result = await db.awards.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Award not found")
    return {"message": "Deleted"}

# ============== CERTIFICATES ROUTES ==============

@api_router.get("/certificates", response_model=List[Certificate])
async def get_certificates():
    """Get all certificates"""
    certificates = await db.certificates.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return certificates

@api_router.post("/certificates", response_model=Certificate)
async def create_certificate(data: CertificateCreate, request: Request):
    """Create certificate (admin only)"""
    await require_admin(request)
    certificate = Certificate(**data.dict())
    await db.certificates.insert_one(certificate.dict())
    return certificate

@api_router.put("/certificates/{id}", response_model=Certificate)
async def update_certificate(id: str, data: CertificateCreate, request: Request):
    """Update certificate (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.certificates.update_one({"id": id}, {"$set": update_data})
    updated = await db.certificates.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return Certificate(**updated)

@api_router.delete("/certificates/{id}")
async def delete_certificate(id: str, request: Request):
    """Delete certificate (admin only)"""
    await require_admin(request)
    result = await db.certificates.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"message": "Deleted"}

# ============== SOCIAL LINKS ROUTES ==============

@api_router.get("/social-links", response_model=List[SocialLink])
async def get_social_links():
    """Get all social links"""
    links = await db.social_links.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return links

@api_router.post("/social-links", response_model=SocialLink)
async def create_social_link(data: SocialLinkCreate, request: Request):
    """Create social link (admin only)"""
    await require_admin(request)
    link = SocialLink(**data.dict())
    await db.social_links.insert_one(link.dict())
    return link

@api_router.put("/social-links/{id}", response_model=SocialLink)
async def update_social_link(id: str, data: SocialLinkCreate, request: Request):
    """Update social link (admin only)"""
    await require_admin(request)
    update_data = data.dict()
    await db.social_links.update_one({"id": id}, {"$set": update_data})
    updated = await db.social_links.find_one({"id": id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Social link not found")
    return SocialLink(**updated)

@api_router.delete("/social-links/{id}")
async def delete_social_link(id: str, request: Request):
    """Delete social link (admin only)"""
    await require_admin(request)
    result = await db.social_links.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"message": "Deleted"}

# ============== PORTFOLIO FULL DATA ==============

@api_router.get("/portfolio")
async def get_full_portfolio():
    """Get complete portfolio data for public view"""
    profile = await db.profile.find_one({}, {"_id": 0}) or Profile().dict()
    experiences = await db.experiences.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    education = await db.education.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    skills = await db.skills.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    research = await db.research.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    books = await db.books.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    projects = await db.projects.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    awards = await db.awards.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    certificates = await db.certificates.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    social_links = await db.social_links.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    return {
        "profile": profile,
        "experiences": experiences,
        "education": education,
        "skills": skills,
        "research": research,
        "books": books,
        "projects": projects,
        "awards": awards,
        "certificates": certificates,
        "social_links": social_links
    }

# ============== STATUS CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Khaled Jasem Portfolio API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
