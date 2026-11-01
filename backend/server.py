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
import math
from urllib.parse import urlparse
import aiohttp
import re
import random
import asyncio
import json
import hashlib
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson import ObjectId

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ModuleNotFoundError:
    LlmChat = None
    UserMessage = None

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


class AIMessage(BaseModel):
    message: str
    language: str = 'pt'


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing credentials')

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('sub') or payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')

        user = await db.users.find_one({'_id': user_id})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')

        return User(
            id=str(user.get('_id', user_id)),
            email=user.get('email', ''),
            name=user.get('name', 'User'),
            role=user.get('role', 'user'),
            language=user.get('language', 'pt'),
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail='Invalid token') from exc


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
            (os.environ.get('OPENROUTER_API_KEY'), 'https://openrouter.ai/api/v1', os.environ.get('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free')),
            (os.environ.get('GROQ_API_KEY'), 'https://api.groq.com/openai/v1', os.environ.get('GROQ_MODEL', 'openai/gpt-oss-120b')),
            (os.environ.get('OPENAI_API_KEY'), None, 'gpt-4o-mini'),
        ]
        providers = [p for p in providers if p[0]]

        system_message = (
            f"Você é o assistente virtual do Watizat. Responda em {language_name}. "
            "Ajude a pessoa a entender o problema, sugerir ações práticas e orientar o próximo passo. "
            "Pode responder sobre moradia, alimentação, trabalho, saúde, direitos, documentos, educação, integração, voluntariado, transporte e uso da plataforma. "
            "Não se limite a Paris; ajude também em Europa, Brasil e outras regiões. "
            "Se a pergunta for urgente, priorize segurança, documentação e contatos importantes. "
            "Responda com empatia, clareza e solução prática."
        )

        if not providers:
            fallback = (
                'Estou pronto para ajudar com a sua situação. '
                'Descreva o problema, a região e o tipo de ajuda que você precisa, '
                'e eu posso sugerir uma solução prática, passos imediatos e o próximo melhor passo.'
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
        raise HTTPException(status_code=500, detail=f'Error processing message: {str(exc)}')


app.include_router(api_router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8000)), reload=False)
