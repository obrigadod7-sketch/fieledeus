from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Any, Optional
import os
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'watizat_db')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title='Watizat API', version='1.0.0')
api_router = APIRouter(prefix='/api')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

security = HTTPBearer(auto_error=False)


class User(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = 'user'
    language: str = 'pt'
    display_name: Optional[str] = None
    use_display_name: bool = False
    help_categories: list[str] = Field(default_factory=list)
    need_categories: list[str] = Field(default_factory=list)
    location: Optional[dict[str, Any]] = None
    show_location: bool = False
    professional_area: Optional[str] = None
    professional_specialties: list[str] = Field(default_factory=list)
    availability: Optional[str] = None
    experience: Optional[str] = None


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = 'migrant'
    languages: Optional[list[str]] = None
    need_categories: Optional[list[str]] = None
    help_categories: Optional[list[str]] = None
    location: Optional[dict] = None
    show_location: bool = False
    professional_area: Optional[str] = None
    professional_specialties: Optional[list[str]] = None
    availability: Optional[str] = None
    experience: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AIMessage(BaseModel):
    message: str
    language: str = 'pt'


class MessageCreate(BaseModel):
    to_user_id: str
    message: Optional[str] = None
    location: Optional[dict[str, Any]] = None
    media: Optional[list[str]] = None
    media_type: Optional[str] = None
    appointment: Optional[dict[str, Any]] = None
    appointment_update: Optional[dict[str, Any]] = None


class UpdateProfile(BaseModel):
    display_name: Optional[str] = None
    use_display_name: Optional[bool] = None
    help_categories: Optional[list[str]] = None
    need_categories: Optional[list[str]] = None
    language: Optional[str] = None
    role: Optional[str] = None
    location: Optional[dict[str, Any]] = None
    show_location: Optional[bool] = None
    professional_area: Optional[str] = None
    professional_specialties: Optional[list[str]] = None
    availability: Optional[str] = None
    experience: Optional[str] = None


async def get_db_user(email: str):
    email = (email or '').strip().lower()
    return await db.users.find_one({'email': email})


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, email: str) -> str:
    payload = {
        'sub': user_id,
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def serialize_user(user_doc: dict[str, Any], user_id: Optional[str] = None) -> dict[str, Any]:
    doc_id = str(user_doc.get('_id') or user_id or '')
    payload = {
        'id': doc_id,
        'email': user_doc.get('email', ''),
        'name': user_doc.get('name', 'User'),
        'role': user_doc.get('role', 'user'),
        'language': user_doc.get('language', 'pt'),
        'display_name': user_doc.get('display_name'),
        'use_display_name': bool(user_doc.get('use_display_name')),
        'help_categories': user_doc.get('help_categories') or [],
        'need_categories': user_doc.get('need_categories') or [],
        'location': user_doc.get('location'),
        'show_location': bool(user_doc.get('show_location')),
        'professional_area': user_doc.get('professional_area'),
        'professional_specialties': user_doc.get('professional_specialties') or [],
        'availability': user_doc.get('availability'),
        'experience': user_doc.get('experience'),
    }
    if user_doc.get('avatar_version') is not None:
        payload['avatar_version'] = user_doc.get('avatar_version')
    return payload


def serialize_message(doc: dict[str, Any]) -> dict[str, Any]:
    message = {
        'id': str(doc.get('id') or doc.get('_id')),
        'from_user_id': doc.get('from_user_id'),
        'to_user_id': doc.get('to_user_id'),
        'message': doc.get('message') or '',
        'created_at': doc.get('created_at') or datetime.now(timezone.utc).isoformat(),
        'updated_at': doc.get('updated_at') or doc.get('created_at') or datetime.now(timezone.utc).isoformat(),
        'location': doc.get('location'),
        'media': doc.get('media') or [],
        'media_type': doc.get('media_type'),
        'appointment': doc.get('appointment'),
        'appointment_update': doc.get('appointment_update'),
        'is_auto_response': bool(doc.get('is_auto_response')),
    }
    if 'status' in doc:
        message['status'] = doc.get('status')
    return message


async def get_user_by_id(user_id: str):
    if not user_id:
        return None
    user = await db.users.find_one({'_id': str(user_id)})
    if user:
        return user
    try:
        return await db.users.find_one({'_id': ObjectId(str(user_id))})
    except Exception:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail='Missing credentials')

    token = credentials.credentials.strip()

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.PyJWTError as exc:
        logging.warning('Invalid JWT: %s', exc)
        raise HTTPException(status_code=401, detail='Invalid token') from exc

    user_id = payload.get('sub') or payload.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid token')

    user = await get_user_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=401, detail='User not found')

    return User(
        id=str(user.get('_id', user_id)),
        email=user.get('email', ''),
        name=user.get('name', 'User'),
        role=user.get('role', 'user'),
        language=user.get('language', 'pt'),
        display_name=user.get('display_name'),
        use_display_name=bool(user.get('use_display_name')),
        help_categories=user.get('help_categories') or [],
        need_categories=user.get('need_categories') or [],
        location=user.get('location'),
        show_location=bool(user.get('show_location')),
        professional_area=user.get('professional_area'),
        professional_specialties=user.get('professional_specialties') or [],
        availability=user.get('availability'),
        experience=user.get('experience'),
    )


@app.get('/')
async def root():
    return {'status': 'ok', 'message': 'Watizat API is running'}


@app.get('/api')
async def api_root():
    return {'status': 'ok', 'message': 'Watizat API is running', 'api_endpoint': '/api'}


@app.get('/health')
async def health():
    try:
        await db.command('ping')
        return {'status': 'healthy', 'database': 'connected'}
    except Exception as exc:
        return {'status': 'unhealthy', 'database': 'disconnected', 'error': str(exc)}


@api_router.get('/health')
async def api_health():
    return {'status': 'ok', 'message': 'Watizat API is healthy'}


@api_router.post('/auth/register')
async def register(user_data: UserRegister):
    email = user_data.email.lower().strip()
    existing = await get_db_user(email)
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    user_doc = {
        '_id': str(uuid.uuid4()),
        'email': email,
        'name': user_data.name.strip(),
        'password': hash_password(user_data.password),
        'role': user_data.role,
        'languages': user_data.languages or ['pt'],
        'need_categories': user_data.need_categories or [],
        'help_categories': user_data.help_categories or [],
        'location': user_data.location,
        'show_location': bool(user_data.show_location),
        'professional_area': user_data.professional_area,
        'professional_specialties': user_data.professional_specialties or [],
        'availability': user_data.availability,
        'experience': user_data.experience,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user_doc)
    token = create_token(user_doc['_id'], email)

    user = User(
        id=user_doc['_id'],
        email=email,
        name=user_data.name.strip(),
        role=user_data.role,
        language='pt',
        help_categories=user_doc['help_categories'],
        need_categories=user_doc['need_categories'],
        location=user_doc.get('location'),
        show_location=user_doc.get('show_location', False),
        professional_area=user_doc.get('professional_area'),
        professional_specialties=user_doc.get('professional_specialties') or [],
        availability=user_doc.get('availability'),
        experience=user_doc.get('experience'),
    )

    return {'token': token, 'user': user.model_dump()}


@api_router.post('/auth/login')
async def login(credentials: UserLogin):
    email = credentials.email.lower().strip()
    user = await get_db_user(email)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = create_token(str(user['_id']), email)
    user_payload = serialize_user(user)
    return {'token': token, 'user': user_payload}


@api_router.get('/auth/me')
async def get_me(current_user: User = Depends(get_current_user)):
    return {'user': current_user.model_dump()}


@api_router.get('/profile')
async def get_profile(current_user: User = Depends(get_current_user)):
    user = await get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return serialize_user(user)


@api_router.put('/profile')
async def update_profile(payload: UpdateProfile, current_user: User = Depends(get_current_user)):
    user = await get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return serialize_user(user)

    await db.users.update_one({'_id': str(current_user.id)}, {'$set': changes})
    refreshed = await get_user_by_id(current_user.id)
    return serialize_user(refreshed)


@api_router.get('/users/{user_id}')
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    payload = serialize_user(user)
    # keep public profile fields, but do not expose password/email unless the user is the same person
    if current_user.id != str(user.get('_id')):
        payload.pop('email', None)
    return payload


@api_router.get('/can-chat/{user_id}')
async def can_chat(user_id: str, current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        return {'can_chat': True, 'reason': 'You can message yourself'}

    other = await get_user_by_id(user_id)
    if not other:
        raise HTTPException(status_code=404, detail='User not found')

    current_categories = set((current_user.help_categories or []) + (current_user.need_categories or []))
    target_needs = set((other.get('need_categories') or []) + (other.get('help_categories') or []))

    if not target_needs:
        return {'can_chat': True, 'reason': 'No chat restriction'}

    can_send = bool(current_categories & target_needs) or not current_categories
    if can_send:
        return {'can_chat': True, 'reason': 'Allowed'}

    return {
        'can_chat': False,
        'reason': 'Você não se comprometeu a ajudar nas categorias desse usuário.',
    }


@api_router.get('/posts')
async def get_posts(
    user_id: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 10,
    skip: int = 0,
    current_user: User = Depends(get_current_user),
):
    query: dict[str, Any] = {}
    if user_id:
        query['user_id'] = user_id
    if type:
        query['type'] = type
    if category:
        query['$or'] = [{'category': category}, {'categories': category}]

    limit = max(1, min(int(limit or 10), 50))
    skip = max(0, int(skip or 0))

    cursor = db.posts.find(query).sort('created_at', -1).skip(skip).limit(limit)
    posts = []
    async for doc in cursor:
        item = {
            'id': str(doc.get('id') or doc.get('_id')),
            'user_id': doc.get('user_id'),
            'type': doc.get('type'),
            'category': doc.get('category'),
            'categories': doc.get('categories') or [doc.get('category')] if doc.get('category') else [],
            'title': doc.get('title'),
            'description': doc.get('description'),
            'created_at': doc.get('created_at'),
            'image_urls': doc.get('image_urls') or [],
            'comment_count': doc.get('comment_count') or 0,
            'user': {
                'id': doc.get('user_id'),
                'name': doc.get('user_name') or 'User',
                'role': doc.get('user_role') or 'user',
            },
        }
        posts.append(item)

    return {'posts': posts, 'has_more': len(posts) == limit, 'next_skip': skip + limit}


@api_router.get('/messages/{user_id}')
async def get_messages(user_id: str, current_user: User = Depends(get_current_user)):
    other_user = await get_user_by_id(user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail='User not found')

    query = {
        '$or': [
            {'from_user_id': current_user.id, 'to_user_id': user_id},
            {'from_user_id': user_id, 'to_user_id': current_user.id},
        ]
    }
    cursor = db.messages.find(query).sort('created_at', 1)
    messages = []
    async for doc in cursor:
        msg = serialize_message(doc)
        messages.append(msg)
    return messages


@api_router.post('/messages')
async def create_message(payload: MessageCreate, current_user: User = Depends(get_current_user)):
    if not payload.to_user_id:
        raise HTTPException(status_code=400, detail='Missing recipient')

    if not payload.message and not payload.location and not (payload.media or []):
        raise HTTPException(status_code=400, detail='Empty message')

    other_user = await get_user_by_id(payload.to_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail='Recipient not found')

    doc_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    doc = {
        'id': doc_id,
        '_id': doc_id,
        'from_user_id': current_user.id,
        'to_user_id': payload.to_user_id,
        'message': payload.message or '',
        'created_at': created_at,
        'updated_at': created_at,
        'location': payload.location,
        'media': payload.media or [],
        'media_type': payload.media_type,
        'appointment': payload.appointment,
        'appointment_update': payload.appointment_update,
        'is_auto_response': False,
    }
    await db.messages.insert_one(doc)
    return serialize_message(doc)


@api_router.post('/ai/chat')
async def ai_chat(message_data: AIMessage, current_user: User = Depends(get_current_user)):
    try:
        question = (message_data.message or '').strip()
        if not question:
            raise HTTPException(status_code=400, detail='Mensagem vazia')

        language = (message_data.language or 'pt').lower()
        language_name = {
            'pt': 'português',
            'fr': 'francês',
            'en': 'inglês',
            'es': 'espanhol',
        }.get(language, 'português')

        providers = [
            (
                os.environ.get('OPENROUTER_API_KEY'),
                'https://openrouter.ai/api/v1',
                os.environ.get('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free'),
            ),
            (
                os.environ.get('GROQ_API_KEY'),
                'https://api.groq.com/openai/v1',
                os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b'),
            ),
            (os.environ.get('OPENAI_API_KEY'), None, 'gpt-4o-mini'),
        ]
        providers = [p for p in providers if p[0]]

        system_message = (
            f'Você é o assistente virtual do Watizat. Responda em {language_name}. '
            'Ajude a pessoa a entender o problema, sugerir ações práticas e orientar o próximo passo. '
            'Pode responder sobre moradia, alimentação, trabalho, saúde, documentos, educação, integração, voluntariado e uso da plataforma. '
            'Não se limite a Paris; ajude também na Europa, no Brasil e em outras regiões. '
            'Responda com empatia, clareza e solução prática.'
        )

        if not providers:
            fallback = (
                'Estou pronto para ajudar com sua situação. '
                'Descreva sua região e o que você precisa, e eu posso te orientar com um próximo passo prático.'
            )
            return {'response': fallback, 'sources': [], 'ai_enabled': False}

        ai_response = None
        last_error = None
        for key, base_url, model in providers:
            try:
                client_ai = AsyncOpenAI(api_key=key, base_url=base_url) if base_url else AsyncOpenAI(api_key=key)
                response = await client_ai.chat.completions.create(
                    model=model,
                    messages=[
                        {'role': 'system', 'content': system_message},
                        {'role': 'user', 'content': question},
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                )
                ai_response = response.choices[0].message.content
                break
            except Exception as exc:
                last_error = exc
                logging.warning('AI provider failed: %s', exc)

        if ai_response is None:
            raise last_error or RuntimeError('No AI provider available')

        return {'response': ai_response, 'sources': [], 'ai_enabled': True}
    except Exception as exc:
        logging.exception('AI Chat error')
        raise HTTPException(status_code=500, detail=f'Error processing message: {str(exc)}') from exc


app.include_router(api_router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8000)), reload=False)
