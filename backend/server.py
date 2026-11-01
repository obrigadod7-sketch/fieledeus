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
