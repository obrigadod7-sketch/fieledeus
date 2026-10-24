#!/usr/bin/env python3
"""
Script de verificação de configuração do Watizat
Verifica se todos os componentes estão prontos para deploy
"""

import os
import sys
import asyncio
from pathlib import Path
import importlib.util

def check_icon(passed):
    return "✅" if passed else "❌"

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def check_file_exists(path, description):
    exists = Path(path).exists()
    print(f"{check_icon(exists)} {description}: {path}")
    return exists

def check_env_var(var_name, required=True):
    value = os.environ.get(var_name)
    exists = value is not None and value != ""
    status = "✅ Configurado" if exists else ("❌ Faltando" if required else "⚠️  Opcional")
    print(f"{status} {var_name}")
    return exists or not required

async def check_mongodb():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        client.close()
        print(f"✅ MongoDB conectado com sucesso")
        return True
    except Exception as e:
        print(f"❌ MongoDB erro: {str(e)}")
        return False

def check_python_packages():
    required = ['fastapi', 'uvicorn', 'motor', 'pymongo', 'bcrypt', 'jwt', 'openai']
    all_ok = True
    for package in required:
        spec = importlib.util.find_spec(package)
        exists = spec is not None
        print(f"{check_icon(exists)} Python package: {package}")
        all_ok = all_ok and exists
    return all_ok

def check_node_modules():
    exists = Path('/app/frontend/node_modules').exists()
    print(f"{check_icon(exists)} Node modules instalado")
    return exists

async def main():
    print("\n🚀 WATIZAT - Verificação de Configuração\n")
    
    # Carregar .env se existir
    env_file = Path('/app/backend/.env')
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print("📄 Arquivo .env carregado")
    
    all_checks = []
    
    # 1. Verificar estrutura de arquivos
    print_header("1. Estrutura de Arquivos")
    all_checks.append(check_file_exists('/app/backend/server.py', 'Backend server'))
    all_checks.append(check_file_exists('/app/backend/requirements.txt', 'Requirements'))
    all_checks.append(check_file_exists('/app/frontend/package.json', 'Frontend package'))
    all_checks.append(check_file_exists('/app/frontend/src/App.js', 'Frontend App'))
    all_checks.append(check_file_exists('/app/backend/.env', 'Backend .env'))
    all_checks.append(check_file_exists('/app/frontend/.env', 'Frontend .env'))
    
    # 2. Verificar variáveis de ambiente
    print_header("2. Variáveis de Ambiente - Backend")
    all_checks.append(check_env_var('MONGO_URL', required=True))
    all_checks.append(check_env_var('JWT_SECRET', required=True))
    all_checks.append(check_env_var('EMERGENT_LLM_KEY', required=False))
    all_checks.append(check_env_var('CORS_ORIGINS', required=True))
    
    print_header("3. Variáveis de Ambiente - Frontend")
    # Carregar frontend .env
    frontend_env = Path('/app/frontend/.env')
    if frontend_env.exists():
        with open(frontend_env) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
    
    backend_url = os.environ.get('REACT_APP_BACKEND_URL')
    has_backend_url = backend_url is not None and backend_url != ""
    print(f"{check_icon(has_backend_url)} REACT_APP_BACKEND_URL: {backend_url if has_backend_url else 'Não configurado'}")
    all_checks.append(has_backend_url)
    
    # 3. Verificar dependências
    print_header("4. Dependências Python")
    all_checks.append(check_python_packages())
    
    print_header("5. Dependências Node.js")
    all_checks.append(check_node_modules())
    
    # 4. Verificar MongoDB
    print_header("6. Conexão MongoDB")
    mongo_ok = await check_mongodb()
    all_checks.append(mongo_ok)
    
    # 5. Verificar arquivos de deploy
    print_header("7. Arquivos de Deploy")
    all_checks.append(check_file_exists('/app/render.yaml', 'Render config'))
    all_checks.append(check_file_exists('/app/railway.json', 'Railway config'))
    all_checks.append(check_file_exists('/app/Procfile', 'Procfile'))
    all_checks.append(check_file_exists('/app/supervisord.conf', 'Supervisord config'))
    
    # Resultado final
    print_header("Resultado Final")
    
    passed = sum(all_checks)
    total = len(all_checks)
    percentage = (passed / total) * 100
    
    print(f"Verificações passadas: {passed}/{total} ({percentage:.1f}%)\n")
    
    if percentage == 100:
        print("🎉 PERFEITO! Tudo configurado corretamente!")
        print("   Você está pronto para fazer deploy no Render ou Railway.")
    elif percentage >= 80:
        print("⚠️  QUASE LÁ! Algumas configurações opcionais faltando.")
        print("   Você pode fazer deploy, mas revise os itens marcados com ❌")
    elif percentage >= 60:
        print("⚠️  ATENÇÃO! Algumas configurações importantes faltando.")
        print("   Corrija os itens marcados com ❌ antes de fazer deploy.")
    else:
        print("❌ CONFIGURAÇÃO INCOMPLETA!")
        print("   Por favor, siga o guia DEPLOY.md para configurar corretamente.")
    
    print("\n📚 Documentação disponível:")
    print("   • DEPLOY.md - Guia completo de deploy")
    print("   • MONGODB_SETUP.md - Configurar MongoDB Atlas")
    print("   • .env.example - Exemplo de variáveis de ambiente")
    
    return 0 if percentage >= 80 else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
