# 🎯 Configurações Específicas por Plataforma

Guia detalhado para configurar a aplicação em diferentes plataformas de deploy.

---

## 🟢 Render

### Estrutura do Projeto no Render

O Render usa o arquivo `render.yaml` para configuração automática (Blueprint).

### Deploy via Blueprint (Recomendado)

1. **Conectar Repositório**
   - Dashboard → New + → Blueprint
   - Conecte seu repositório GitHub
   - Render detectará `render.yaml` automaticamente

2. **Configurar Variáveis**
   - MONGO_URL será solicitado durante o setup
   - Outras variáveis já estão no `render.yaml`

3. **Deploy Automático**
   - Render criará 2 serviços:
     - `watizat-backend` (Web Service)
     - `watizat-frontend` (Static Site)

### Deploy Manual (Alternativa)

#### Backend:
```yaml
Name: watizat-backend
Environment: Python
Build Command: cd backend && pip install -r requirements.txt
Start Command: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
```
MONGO_URL=mongodb+srv://...
DB_NAME=watizat_db
JWT_SECRET=[AUTO-GENERATED]
EMERGENT_LLM_KEY=sk-emergent-b8cEdA5822d14C0638
CORS_ORIGINS=*
PYTHON_VERSION=3.11.0
```

#### Frontend:
```yaml
Name: watizat-frontend
Environment: Node
Build Command: cd frontend && yarn install && yarn build
Publish Directory: ./frontend/build
```

**Environment Variables:**
```
REACT_APP_BACKEND_URL=${{watizat-backend.RENDER_EXTERNAL_URL}}
NODE_VERSION=18.x
```

### Conectar Frontend ao Backend

No Render, use a variável de serviço:
```
REACT_APP_BACKEND_URL=${{watizat-backend.RENDER_EXTERNAL_URL}}
```

Render substitui automaticamente pela URL real do backend.

### Health Checks

Render faz health check em `/api` automaticamente.

### Logs

- Dashboard → Service → Logs
- Logs em tempo real disponíveis
- Pode filtrar por erro/info/warning

### Custom Domain

1. Settings → Custom Domain
2. Adicione seu domínio
3. Configure DNS CNAME
4. SSL automático via Let's Encrypt

---

## 🚂 Railway

### Estrutura do Projeto no Railway

Railway detecta automaticamente Python e Node.js.

### Deploy Automático

1. **Novo Projeto**
   - Dashboard → New Project
   - Deploy from GitHub repo
   - Selecione seu repositório

2. **Railway Detecta:**
   - `Procfile` → Comando de start
   - `railway.json` → Configurações
   - `requirements.txt` → Dependências Python
   - `package.json` → Dependências Node

3. **Configurar Variáveis**
   - Dashboard → Variables
   - Adicione todas as variáveis necessárias

### Variáveis de Ambiente

```
MONGO_URL=mongodb+srv://...
DB_NAME=watizat_db
JWT_SECRET=seu_secret_aqui
EMERGENT_LLM_KEY=sk-emergent-b8cEdA5822d14C0638
CORS_ORIGINS=*
PORT=8001
```

### Procfile

Railway usa o `Procfile`:
```
web: supervisord -c supervisord.conf
```

Isso inicia backend e frontend simultaneamente via supervisor.

### Conectar Frontend ao Backend

No Railway, após deploy, você terá uma URL pública.

Atualize `frontend/.env`:
```
REACT_APP_BACKEND_URL=https://seu-projeto.up.railway.app
```

Commit e push → Railway faz redeploy automático.

### Build Logs

- Dashboard → Deployments → Build Logs
- Mostra instalação de dependências
- Útil para debug

### Runtime Logs

- Dashboard → Deployments → View Logs
- Logs de backend e frontend
- Filtros disponíveis

### Custom Domain

1. Settings → Generate Domain (grátis)
2. Ou adicione Custom Domain
3. Configure DNS
4. SSL automático

### Restart

- Dashboard → Service → Settings → Restart

---

## 🔵 Heroku (Alternativa)

### Preparação

Heroku usa `Procfile` e detecta Python/Node automaticamente.

### Deploy

```bash
# Login
heroku login

# Criar app
heroku create watizat-app

# Adicionar buildpacks
heroku buildpacks:add --index 1 heroku/python
heroku buildpacks:add --index 2 heroku/nodejs

# Configurar variáveis
heroku config:set MONGO_URL="mongodb+srv://..."
heroku config:set JWT_SECRET="seu_secret"
heroku config:set EMERGENT_LLM_KEY="sk-emergent-..."
heroku config:set CORS_ORIGINS="*"

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Procfile para Heroku

```
web: supervisord -c supervisord.conf
```

### Dyno Configuration

- Free tier: 1 dyno (backend + frontend via supervisor)
- Paid: Escale horizontalmente

---

## 🌐 Vercel (Frontend Only)

Vercel é ideal para hospedar apenas o frontend.

### Deploy Frontend

1. **Conectar Repositório**
   - Dashboard → New Project
   - Import Git Repository

2. **Configurar Build**
   - Framework: Create React App
   - Build Command: `cd frontend && yarn build`
   - Output Directory: `frontend/build`
   - Install Command: `cd frontend && yarn install`

3. **Environment Variables**
```
REACT_APP_BACKEND_URL=https://seu-backend.onrender.com
```

4. **Deploy**
   - Vercel faz deploy automático
   - HTTPS e CDN inclusos

### Backend Separado

Para Vercel, hospede o backend separadamente:
- Render (backend) + Vercel (frontend)
- Railway (backend) + Vercel (frontend)

---

## 🐳 Docker (Opcional)

### Dockerfile Backend

```dockerfile
FROM python:3.11-slim

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Dockerfile Frontend

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install

COPY frontend/ .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/frontend/build /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=${MONGO_URL}
      - JWT_SECRET=${JWT_SECRET}
      - EMERGENT_LLM_KEY=${EMERGENT_LLM_KEY}
      - CORS_ORIGINS=*
    depends_on:
      - mongodb

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### Rodar com Docker

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ☁️ AWS (Avançado)

### Opções AWS

1. **Elastic Beanstalk** (mais simples)
2. **ECS + Fargate** (containers)
3. **EC2** (manual)
4. **Lambda + API Gateway** (serverless)

### Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 watizat-app

# Create environment
eb create watizat-env

# Configure
eb setenv MONGO_URL="..." JWT_SECRET="..." EMERGENT_LLM_KEY="..."

# Deploy
eb deploy

# Open
eb open
```

---

## 📊 Comparação de Plataformas

| Plataforma | Facilidade | Preço Free | Escalabilidade | SSL | Custom Domain |
|------------|------------|------------|----------------|-----|---------------|
| **Render** | ⭐⭐⭐⭐⭐ | 750h/mês | ⭐⭐⭐⭐ | ✅ Auto | ✅ Sim |
| **Railway** | ⭐⭐⭐⭐⭐ | $5 crédito | ⭐⭐⭐⭐ | ✅ Auto | ✅ Sim |
| **Heroku** | ⭐⭐⭐⭐ | 550h/mês | ⭐⭐⭐ | ✅ Auto | ✅ Sim |
| **Vercel** | ⭐⭐⭐⭐⭐ | Ilimitado | ⭐⭐⭐⭐⭐ | ✅ Auto | ✅ Sim |
| **Docker** | ⭐⭐⭐ | Depende | ⭐⭐⭐⭐⭐ | ⚙️ Manual | ⚙️ Manual |
| **AWS** | ⭐⭐ | 12 meses | ⭐⭐⭐⭐⭐ | ⚙️ Manual | ✅ Sim |

### Recomendações

- **Iniciante**: Render ou Railway
- **Frontend Only**: Vercel
- **Controle Total**: Docker
- **Escala Empresarial**: AWS ou GCP
- **Custo Zero**: Render (750h) + MongoDB Atlas (512MB)

---

## 🔄 CI/CD

### GitHub Actions (para qualquer plataforma)

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && pip install -r requirements.txt
          cd ../frontend && yarn install
      
      - name: Run tests
        run: |
          cd backend && pytest
          cd ../frontend && yarn test
      
      - name: Deploy to Render
        run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## 📚 Recursos por Plataforma

### Render
- [Docs](https://render.com/docs)
- [Blueprints](https://render.com/docs/infrastructure-as-code)
- [Environment Groups](https://render.com/docs/environment-variables)

### Railway
- [Docs](https://docs.railway.app)
- [Templates](https://railway.app/templates)
- [CLI](https://docs.railway.app/develop/cli)

### Vercel
- [Docs](https://vercel.com/docs)
- [CLI](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Escolha a plataforma que melhor se adapta às suas necessidades! 🚀**
