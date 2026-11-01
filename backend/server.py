from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
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

    user = None
    try:
        user = await db.users.find_one({'_id': str(user_id)})
        if not user:
            try:
                user = await db.users.find_one({'_id': ObjectId(str(user_id))})
            except Exception:
                user = None
    except Exception as exc:
        logging.exception('Mongo lookup failed in get_current_user')
        raise HTTPException(status_code=503, detail='Database unavailable') from exc

    if not user:
        raise HTTPException(status_code=401, detail='User not found')

    return User(
        id=str(user.get('_id', user_id)),
        email=user.get('email', ''),
        name=user.get('name', 'User'),
        role=user.get('role', 'user'),
        language=user.get('language', 'pt'),
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
    user_payload = User(
        id=str(user['_id']),
        email=email,
        name=user.get('name', 'User'),
        role=user.get('role', 'user'),
        language=user.get('language', 'pt'),
    )

    return {'token': token, 'user': user_payload.model_dump()}


@api_router.get('/auth/me')
async def get_me(current_user: User = Depends(get_current_user)):
    return {'user': current_user.model_dump()}


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
