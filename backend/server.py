from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import Response, RedirectResponse
import base64
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from openai import AsyncOpenAI
from pdf_processor import WatizatPDFProcessor
from auto_responses import get_auto_response, format_auto_response_post
from help_locations import HELP_LOCATIONS, get_all_help_locations, get_help_locations_by_category
import math
from urllib.parse import urlparse
import aiohttp
import re
import random
import asyncio
import json
import hashlib
from fastapi import UploadFile, File, Request
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson import ObjectId
from email_service import send_email, reset_code_email

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ModuleNotFoundError:
    LlmChat = None
    UserMessage = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)

# Extrai o nome do banco de dados da URL ou usa DB_NAME
def get_database_name():
    db_name = os.environ.get('DB_NAME', '')
    if db_name and db_name != 'test_database':
        return db_name

    parsed = urlparse(mongo_url)
    if parsed.path and len(parsed.path) > 1:
        extracted_db = parsed.path.lstrip('/')
        if '?' in extracted_db:
            extracted_db = extracted_db.split('?')[0]
        if extracted_db:
            return extracted_db

    return db_name if db_name else 'watizat_db'

db = client[get_database_name()]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

api_router = APIRouter(prefix="/api")

@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "message": "Watizat API is running",
        "api_endpoint": "/api"
    }

@app.get("/health")
async def health():
    try:
        await db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
ALGORITHM = "HS256"

pdf_processor = WatizatPDFProcessor()

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    display_name: Optional[str] = None
    use_display_name: bool = False
    role: str
    location: Optional[dict] = None
    bio: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    avatar_version: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AvatarUpload(BaseModel):
    image: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    languages: List[str] = Field(default_factory=list)
    professional_area: Optional[str] = None
    professional_specialties: Optional[List[str]] = Field(default_factory=list)
    availability: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    certifications: Optional[List[str]] = Field(default_factory=list)
    professional_id: Optional[str] = None
    organization: Optional[str] = None
    years_experience: Optional[str] = None
    help_types: Optional[List[str]] = Field(default_factory=list)
    help_categories: Optional[List[str]] = Field(default_factory=list)
    need_categories: Optional[List[str]] = Field(default_factory=list)
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    location: Optional[dict] = None
    show_location: bool = False

class UserLogin(BaseModel):
    email: str
    password: str

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    category: str
    categories: List[str] = Field(default_factory=list)
    title: str
    description: str
    location: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCreate(BaseModel):
    type: str
    category: str
    categories: Optional[List[str]] = Field(default_factory=list)
    title: str
    description: str
    location: Optional[dict] = None
    images: Optional[List[str]] = Field(default_factory=list)

class PostComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Advertisement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    is_active: bool = True
    priority: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdvertisementCreate(BaseModel):
    type: str
    title: str
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    is_active: bool = True
    priority: int = 0

class PostCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    description: str
    address: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[dict] = None
    hours: Optional[str] = None

class AIMessage(BaseModel):
    message: str
    language: str = "pt"

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    helper_id: str
    migrant_id: str
    status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def normalize_country_code(value: Optional[str]) -> str:
    if value is None:
        return ""
    raw = value.strip().lower()
    if not raw:
        return ""
    mapping = {
        'brazil': 'br', 'brasil': 'br', 'pt-br': 'br', 'portugal': 'pt', 'france': 'fr', 'franca': 'fr', 'germany': 'de', 'alemania': 'de', 'spain': 'es', 'espanha': 'es', 'italy': 'it', 'italia': 'it', 'united states': 'us', 'usa': 'us', 'uk': 'uk', 'united kingdom': 'uk', 'canada': 'ca', 'australia': 'au', 'worldwide': '', 'global': '', 'remote': '', 'home office': '', 'home-office': ''
    }
    return mapping.get(raw, raw[:2])


def infer_job_location_query(location: Optional[str], remote_only: bool = False) -> tuple[str, str]:
    if not location or not location.strip():
        return ('', 'Worldwide' if not remote_only else 'Remote')
    cleaned = location.strip()
    if cleaned.lower() in {'worldwide', 'global', 'remote', 'home office', 'home-office'}:
        return ('', 'Worldwide')
    return (cleaned, cleaned)


def build_document_html(title: str, body: str, doc_type: str = 'report') -> str:
    clean_title = (title or 'Documento').strip() or 'Documento'
    sections = [
        "<html><head><meta charset='utf-8'><style>",
        "body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }",
        "h1 { color: #0f172a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }",
        "p { line-height: 1.6; }",
        ".meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }",
        "</style></head><body>",
        f"<div class='meta'>{doc_type.upper()}</div>",
        f"<h1>{clean_title}</h1>",
        body,
        "</body></html>"
    ]
    return ''.join(sections)


def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')

        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def email_query(email: str):
    return {'$regex': f'^{re.escape(email.strip())}$', '$options': 'i'}


def is_admin_email(email: str) -> bool:
    admins = {e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()}
    return (email or '').strip().lower() in admins

@app.on_event("startup")
async def create_indexes():
    try:
        await db.posts.create_index([('created_at', -1)])
        await db.posts.create_index('id', unique=True)
        await db.posts.create_index([('type', 1), ('created_at', -1)])
        await db.posts.create_index('user_id')
        await db.users.create_index('id', unique=True)
        await db.users.create_index('email', unique=True)
        await db.comments.create_index([('post_id', 1), ('created_at', 1)])
        await db.messages.create_index([('from_user_id', 1), ('to_user_id', 1)])
        await db.avatars.create_index('user_id', unique=True)
    except Exception as e:
        logger.warning(f"Index creation skipped: {e}")
    await seed_admin()


async def seed_admin():
    email = os.environ.get('ADMIN_EMAIL')
    password = os.environ.get('ADMIN_PASSWORD')
    if not email or not password:
        return
    email = email.strip().lower()
    existing = await db.users.find_one({'email': email}, {'_id': 0, 'id': 1, 'password': 1, 'role': 1})
    if existing is None:
        admin = User(email=email, name='Administrador', role='admin', languages=['pt']).model_dump()
        admin['password'] = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        admin['created_at'] = admin['created_at'].isoformat()
        await db.users.insert_one(admin)
        logger.info(f"Admin criado: {email}")
        return
    updates = {}
    if existing.get('role') != 'admin':
        updates['role'] = 'admin'
    if not existing.get('password') or not bcrypt.checkpw(password.encode(), existing['password'].encode()):
        updates['password'] = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    if updates:
        await db.users.update_one({'email': email}, {'$set': updates})
        logger.info(f"Admin atualizado: {email}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    user_data.email = user_data.email.strip().lower()
    existing = await db.users.find_one({'email': email_query(user_data.email)}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())

    user = User(
        email=user_data.email,
        name=user_data.name,
        role='admin' if is_admin_email(user_data.email) else user_data.role,
        languages=user_data.languages
    )

    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw.decode()
    user_dict['created_at'] = user_dict['created_at'].isoformat()

    if user_data.role == 'volunteer':
        user_dict['professional_area'] = user_data.professional_area
        user_dict['professional_specialties'] = user_data.professional_specialties or []
        user_dict['availability'] = user_data.availability
        user_dict['experience'] = user_data.experience
        user_dict['education'] = user_data.education
        user_dict['certifications'] = user_data.certifications or []
        user_dict['professional_id'] = user_data.professional_id
        user_dict['organization'] = user_data.organization
        user_dict['years_experience'] = user_data.years_experience
        user_dict['help_types'] = user_data.help_types or []
        user_dict['help_categories'] = user_data.help_categories or []
        user_dict['phone'] = user_data.phone
        user_dict['linkedin'] = user_data.linkedin
        user_dict['location'] = user_data.location
        user_dict['show_location'] = user_data.show_location

    if user_data.role == 'migrant':
        user_dict['need_categories'] = user_data.need_categories or []
        user_dict['location'] = user_data.location
        user_dict['show_location'] = user_data.show_location

    if user_data.role == 'helper':
        user_dict['help_categories'] = user_data.help_categories or []
        user_dict['location'] = user_data.location
        user_dict['show_location'] = user_data.show_location

    await db.users.insert_one(user_dict)

    token = create_token(user.id, user.email)
    return {'token': token, 'user': user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_data = await db.users.find_one({'email': email_query(credentials.email)}, {'_id': 0})

    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(credentials.password.encode(), user_data['password'].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_data.pop('password')
    if is_admin_email(user_data['email']) and user_data.get('role') != 'admin':
        user_data['role'] = 'admin'
        await db.users.update_one({'id': user_data['id']}, {'$set': {'role': 'admin'}})
    if isinstance(user_data['created_at'], str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])

    user = User(**user_data)
    token = create_token(user.id, user.email)

    return {'token': token, 'user': user}

@api_router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

AVATAR_MAX_BYTES = 600_000
AVATAR_MIMES = {'image/jpeg', 'image/png', 'image/webp'}

@api_router.put("/profile/avatar")
async def upload_avatar(payload: AvatarUpload, current_user: User = Depends(get_current_user)):
    if len(payload.image) > 820_000:
        raise HTTPException(status_code=413, detail='Imagem muito grande')
    header, _, data = payload.image.partition(',')
    mime = header[5:].split(';')[0] if header.startswith('data:') else ''
    if mime not in AVATAR_MIMES or not data:
        raise HTTPException(status_code=400, detail='Formato de imagem inválido')
    try:
        raw = base64.b64decode(data, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail='Imagem inválida')
    if len(raw) > AVATAR_MAX_BYTES:
        raise HTTPException(status_code=413, detail='Imagem muito grande')
    version = int(datetime.now(timezone.utc).timestamp() * 1000)
    await db.avatars.update_one({'user_id': current_user.id}, {'$set': {'data': raw, 'mime': mime, 'version': version}}, upsert=True)
    await db.users.update_one({'id': current_user.id}, {'$set': {'avatar_version': version}})
    return {'avatar_version': version}

@api_router.delete("/profile/avatar")
async def delete_avatar(current_user: User = Depends(get_current_user)):
    await db.avatars.delete_one({'user_id': current_user.id})
    await db.users.update_one({'id': current_user.id}, {'$unset': {'avatar_version': ''}})
    return {'avatar_version': None}

@api_router.get("/users/{user_id}/avatar")
async def get_avatar(user_id: str):
    doc = await db.avatars.find_one({'user_id': user_id}, {'_id': 0, 'data': 1, 'mime': 1})
    if not doc:
        raise HTTPException(status_code=404, detail='Sem foto')
    return Response(content=bytes(doc['data']), media_type=doc['mime'], headers={'Cache-Control': 'public, max-age=31536000, immutable'})

@api_router.put("/profile")
async def update_profile(updates: dict, current_user: User = Depends(get_current_user)):
    allowed_fields = ['name', 'bio', 'location', 'languages', 'categories', 'help_categories', 'need_categories', 'display_name', 'use_display_name']
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    await db.users.update_one({'id': current_user.id}, {'$set': update_data})
    updated_user = await db.users.find_one({'id': current_user.id}, {'_id': 0, 'password': 0})
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    return User(**updated_user)

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    categories_list = post_data.categories if post_data.categories else [post_data.category]
    post = Post(
        user_id=current_user.id,
        type=post_data.type,
        category=post_data.category,
        categories=categories_list,
        title=post_data.title,
        description=post_data.description,
        location=post_data.location
    )
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    post_dict['images'] = post_data.images or []
    await db.posts.insert_one(post_dict)
    return post

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, comment_data: PostCommentCreate, current_user: User = Depends(get_current_user)):
    if not await db.posts.find_one({'id': post_id}, {'_id': 1}):
        raise HTTPException(status_code=404, detail='Post não encontrado')
    comment = PostComment(post_id=post_id, user_id=current_user.id, comment=comment_data.comment)
    comment_dict = comment.model_dump()
    comment_dict['created_at'] = comment_dict['created_at'].isoformat()
    await db.comments.insert_one(comment_dict)
    return comment

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.comments.find({'post_id': post_id}, {'_id': 0}).sort('created_at', 1).to_list(500)
    return comments

@api_router.get("/posts")
async def get_posts(type: Optional[str] = None, category: Optional[str] = None, user_id: Optional[str] = None, limit: int = 10, skip: int = 0, current_user: User = Depends(get_current_user)):
    limit = max(1, min(limit, 50))
    skip = max(0, skip)
    conditions = [{'is_auto_response': {'$ne': True}}]
    if type:
        conditions.append({'type': type})
    if user_id:
        conditions.append({'user_id': user_id})
    if category:
        conditions.append({'$or': [{'category': category}, {'categories': category}]})
    pipeline = [
        {'$match': {'$and': conditions}},
        {'$sort': {'created_at': -1}},
        {'$skip': skip},
        {'$limit': limit + 1},
        {'$addFields': {'image_count': {'$size': {'$ifNull': ['$images', []]}}}},
        {'$project': {'_id': 0, 'images': 0}}
    ]
    posts = await db.posts.aggregate(pipeline).to_list(limit + 1)
    has_more = len(posts) > limit
    posts = posts[:limit]
    post_ids = [p['id'] for p in posts]
    user_ids = list({p['user_id'] for p in posts if p.get('user_id') != 'system'})
    users_dict = {}
    if user_ids:
        async for u in db.users.find({'id': {'$in': user_ids}}, {'_id': 0, 'id': 1, 'name': 1, 'display_name': 1, 'use_display_name': 1, 'role': 1, 'avatar_version': 1}):
            users_dict[u['id']] = u
    comment_counts = {}
    if post_ids:
        async for c in db.comments.aggregate([
            {'$match': {'post_id': {'$in': post_ids}}},
            {'$group': {'_id': '$post_id', 'n': {'$sum': 1}}}
        ]):
            comment_counts[c['_id']] = c['n']
    for post in posts:
        if post.get('user_id') == 'system':
            post['user'] = {'name': 'Watizat Assistant', 'role': 'assistant'}
        else:
            u = users_dict.get(post.get('user_id'))
            if u:
                name = u.get('display_name') if u.get('use_display_name') and u.get('display_name') else u.get('name')
                post['user'] = {'id': u['id'], 'name': name, 'role': u.get('role'), 'avatar_version': u.get('avatar_version')}
        if not post.get('categories'):
            post['categories'] = [post['category']] if post.get('category') else []
        post['image_urls'] = [f"/api/posts/{post['id']}/images/{i}" for i in range(post.pop('image_count', 0))]
        post['video_url'] = f"/api/posts/{post['id']}/video" if post.get('has_video') else None
        post['comment_count'] = comment_counts.get(post['id'], 0)
        post['can_help'] = True
    return {'posts': posts, 'has_more': has_more, 'next_skip': skip + len(posts)}

@api_router.get("/posts/{post_id}/images/{idx}")
async def get_post_image(post_id: str, idx: int):
    doc = await db.posts.find_one({'id': post_id}, {'_id': 0, 'images': {'$slice': [idx, 1]}})
    if not doc or not doc.get('images'):
        raise HTTPException(status_code=404, detail='Imagem não encontrada')
    img = doc['images'][0]
    headers = {'Cache-Control': 'public, max-age=604800, immutable'}
    if isinstance(img, str) and img.startswith('data:'):
        header, _, data = img.partition(',')
        mime = header[5:].split(';')[0] or 'image/jpeg'
        return Response(content=base64.b64decode(data), media_type=mime, headers=headers)
    if isinstance(img, str) and img.startswith('http'):
        return RedirectResponse(img)
    raise HTTPException(status_code=404, detail='Imagem inválida')

@api_router.post("/documents/generate")
async def generate_document(payload: dict, current_user: User = Depends(get_current_user)):
    title = str(payload.get('title') or 'Documento').strip() or 'Documento'
    content = str(payload.get('content') or '').strip()
    doc_type = str(payload.get('type') or 'report').strip() or 'report'
    if not content:
        sections = payload.get('sections') or []
        content = '\n\n'.join(f'<p><strong>{section.get("title", "Seção")}</strong><br>{section.get("text", "")}</p>' for section in sections if isinstance(section, dict))
    if not content:
        content = '<p>Documento gerado com sucesso.</p>'
    html = build_document_html(title, content, doc_type)
    return {
        'title': title,
        'type': doc_type,
        'content': html,
        'download_name': f"{title.lower().replace(' ', '-')}.html",
        'message': 'Documento gerado com sucesso'
    }

@api_router.get("/services")
async def get_services(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    services = await db.services.find(query, {'_id': 0}).to_list(100)
    return services

@api_router.post("/ai/chat")
async def ai_chat(message_data: AIMessage, current_user: User = Depends(get_current_user)):
    try:
        providers = [
            (os.environ.get('OPENROUTER_API_KEY'), "https://openrouter.ai/api/v1", os.environ.get('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free')),
            (os.environ.get('GROQ_API_KEY'), "https://api.groq.com/openai/v1", os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')),
            (os.environ.get('OPENAI_API_KEY'), None, 'gpt-4o-mini'),
        ]
        providers = [p for p in providers if p[0]]

        if not providers:
            pdf_processor.load_index()
            relevant_chunks = pdf_processor.search(message_data.message, k=3)
            if relevant_chunks:
                context_response = f"Encontrei as seguintes informações no Guia Watizat que podem ajudar:\n\n{chr(10).join([f'• {chunk[:300]}...' if len(chunk) > 300 else f'• {chunk}' for chunk in relevant_chunks[:3]])}\n\nPara mais informações, consulte o Guia Watizat completo ou entre em contato com um voluntário."
            else:
                context_response = "Não encontrei informações específicas sobre sua pergunta no guia.\n\nVocê pode:\n• Criar um post na seção \"Preciso de Ajuda\"\n• Entrar em contato com voluntários disponíveis\n• Consultar os locais de ajuda no mapa\n\nEstamos aqui para ajudar!"
            chat_record = {'id': str(uuid.uuid4()), 'user_id': current_user.id, 'message': message_data.message, 'response': context_response, 'language': message_data.language, 'ai_enabled': False, 'created_at': datetime.now(timezone.utc).isoformat()}
            await db.ai_chats.insert_one(chat_record)
            return {'response': context_response, 'sources': relevant_chunks[:2] if relevant_chunks else [], 'ai_enabled': False}

        pdf_processor.load_index()
        relevant_chunks = pdf_processor.search(message_data.message, k=3)
        context = "\n\n".join(relevant_chunks) if relevant_chunks else "Informação não encontrada no guia Watizat."
        system_message = f"Você é um assistente especializado em ajudar migrantes em Paris. Use as informações do guia Watizat abaixo para responder perguntas. Seja empático, claro e objetivo. Responda em {message_data.language}.\n\nContexto do Watizat:\n{context}\n"
        ai_response = None
        last_error = None
        for key, base_url, model in providers:
            try:
                client_ai = AsyncOpenAI(api_key=key, base_url=base_url) if base_url else AsyncOpenAI(api_key=key)
                response = await client_ai.chat.completions.create(model=model, messages=[{'role': 'system', 'content': system_message}, {'role': 'user', 'content': message_data.message}], temperature=0.7, max_tokens=1000)
                ai_response = response.choices[0].message.content
                break
            except Exception as e:
                last_error = e
                logging.warning(f"AI provider {base_url or 'openai'} failed: {e}")
        if ai_response is None:
            raise last_error
        chat_record = {'id': str(uuid.uuid4()), 'user_id': current_user.id, 'message': message_data.message, 'response': ai_response, 'language': message_data.language, 'ai_enabled': True, 'created_at': datetime.now(timezone.utc).isoformat()}
        await db.ai_chats.insert_one(chat_record)
        return {'response': ai_response, 'sources': relevant_chunks[:2] if relevant_chunks else [], 'ai_enabled': True}
    except Exception as e:
        logging.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing message")

RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')
JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com"

class JobSearchQuery(BaseModel):
    query: str = Field(default="", description="Termo de busca")
    location: str = Field(default="Worldwide", description="Localização")
    page: int = Field(default=1, description="Página")
    num_pages: int = Field(default=1, description="Número de páginas")
    date_posted: str = Field(default="all", description="Filtro de data")
    remote_jobs_only: bool = Field(default=False, description="Apenas trabalho remoto")
    employment_types: Optional[str] = Field(default=None, description="FULLTIME, PARTTIME, CONTRACTOR, INTERN")

@api_router.get("/jobs/search")
async def search_jobs(
    query: str = "emprego",
    location: str = "Worldwide",
    page: int = 1,
    date_posted: str = "all",
    remote_only: bool = False,
    employment_type: Optional[str] = None,
    country: Optional[str] = None,
):
    """Busca vagas de emprego sem fixar o país como França; aceita país e home office."""
    country_code = normalize_country_code(country or location)
    normalized_query = query.strip() or 'emprego'
    if remote_only and 'remote' not in normalized_query.lower():
        normalized_query = f"{normalized_query} remote"
    cache_key = f"jobs_{normalized_query}_{location}_{country_code}_{remote_only}_{page}_{date_posted}"
    cached = await db.job_cache.find_one({'cache_key': cache_key})
    if cached:
        expires_at = cached.get('expires_at')
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                return {'jobs': cached.get('jobs', []), 'total': cached.get('total', 0), 'page': page, 'cached': True}
    if not RAPIDAPI_KEY:
        return {'jobs': [], 'total': 0, 'page': page, 'cached': False, 'message': 'Busca de vagas indisponível: configure RAPIDAPI_KEY'}
    headers = {'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'}
    params = {'query': f"{normalized_query} {location}".strip(), 'page': str(page), 'num_pages': '1', 'date_posted': date_posted}
    if country_code:
        params['country'] = country_code
    if remote_only:
        params['remote_jobs_only'] = 'true'
    if employment_type:
        params['employment_types'] = employment_type
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{JSEARCH_BASE_URL}/search", headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logging.error(f"JSearch API error: {response.status} - {error_text}")
                    raise HTTPException(status_code=response.status, detail=f"Erro na API: {error_text}")
                data = await response.json()
                jobs = []
                for job in data.get('data', []):
                    jobs.append({
                        'id': job.get('job_id', str(uuid.uuid4())),
                        'title': job.get('job_title', 'Vaga sem título'),
                        'company': job.get('employer_name', 'Empresa não informada'),
                        'company_logo': job.get('employer_logo'),
                        'location': job.get('job_city', job.get('job_country', location or 'Remote')),
                        'description': job.get('job_description', '')[:500] + '...' if job.get('job_description') else '',
                        'employment_type': job.get('job_employment_type', 'Não informado'),
                        'date_posted': job.get('job_posted_at_datetime_utc', ''),
                        'url': job.get('job_apply_link', job.get('job_google_link', '')),
                        'source': job.get('job_publisher', 'JSearch'),
                        'salary_min': job.get('job_min_salary'),
                        'salary_max': job.get('job_max_salary'),
                        'salary_currency': job.get('job_salary_currency'),
                        'is_remote': bool(job.get('job_is_remote', remote_only)),
                        'qualifications': job.get('job_required_skills', []),
                        'benefits': job.get('job_benefits', [])
                    })
                total = data.get('total', len(jobs))
                await db.job_cache.update_one({'cache_key': cache_key}, {'$set': {'cache_key': cache_key, 'jobs': jobs, 'total': total, 'expires_at': datetime.now(timezone.utc) + timedelta(hours=1), 'created_at': datetime.now(timezone.utc).isoformat()}}, upsert=True)
                return {'jobs': jobs, 'total': total, 'page': page, 'cached': False}
    except aiohttp.ClientError as e:
        logging.error(f"JSearch API connection error: {e}")
        raise HTTPException(status_code=503, detail=f"Erro de conexão com a API: {str(e)}")
    except Exception as e:
        logging.error(f"JSearch API error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
