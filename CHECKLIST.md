# ✅ Checklist de Deploy - Watizat

Use este checklist para garantir que tudo está pronto antes do deploy.

---

## 📋 Pré-Deploy

### 1. MongoDB Atlas
- [ ] Conta criada no MongoDB Atlas
- [ ] Cluster M0 (free) criado
- [ ] Usuário do banco criado (username + senha)
- [ ] IP `0.0.0.0/0` adicionado à whitelist
- [ ] Connection string obtida e testada
- [ ] Connection string NÃO contém `<password>` (substituído pela senha real)

### 2. Código no GitHub
- [ ] Repositório criado no GitHub
- [ ] Código commitado e pushed
- [ ] `.env` NÃO foi commitado (está no .gitignore)
- [ ] `README_DEPLOY.md` incluído no repo

### 3. Variáveis de Ambiente Preparadas
- [ ] `MONGO_URL` - Connection string completa
- [ ] `JWT_SECRET` - String aleatória segura (min 32 caracteres)
- [ ] `EMERGENT_LLM_KEY` - sk-emergent-b8cEdA5822d14C0638
- [ ] `CORS_ORIGINS` - * (dev) ou URLs específicas (prod)
- [ ] `REACT_APP_BACKEND_URL` - URL do backend

### 4. Verificação Local (Opcional mas Recomendado)
- [ ] Executou `python3 check_setup.py` → Sucesso 90%+
- [ ] Backend iniciou sem erros: `http://localhost:8001/docs`
- [ ] Frontend iniciou sem erros: `http://localhost:3000`
- [ ] Conseguiu criar conta de teste
- [ ] Conseguiu fazer login
- [ ] Posts são exibidos corretamente

---

## 🎯 Deploy no Render

### Setup Inicial
- [ ] Conta criada no Render (render.com)
- [ ] Repositório GitHub conectado ao Render
- [ ] Aceitar permissões de acesso ao repositório

### Deploy via Blueprint
- [ ] New + → Blueprint
- [ ] Repositório selecionado
- [ ] Render detectou `render.yaml`
- [ ] Variável `MONGO_URL` adicionada quando solicitado

### Verificação
- [ ] Build do backend concluído com sucesso
- [ ] Build do frontend concluído com sucesso
- [ ] Backend está "Live" (bolinha verde)
- [ ] Frontend está "Live" (bolinha verde)
- [ ] Health check do backend passou (acessível via URL)
- [ ] Frontend carregou corretamente

### Teste Pós-Deploy
- [ ] Abrir URL do frontend
- [ ] Criar conta de teste
- [ ] Fazer login com sucesso
- [ ] Criar um post
- [ ] Ver posts no feed
- [ ] Testar chat (se aplicável)

---

## 🚂 Deploy no Railway

### Setup Inicial
- [ ] Conta criada no Railway (railway.app)
- [ ] GitHub conectado ao Railway

### Deploy
- [ ] New Project → Deploy from GitHub repo
- [ ] Repositório selecionado
- [ ] Railway detectou Python e Node.js
- [ ] Todas variáveis de ambiente adicionadas:
  - [ ] MONGO_URL
  - [ ] JWT_SECRET
  - [ ] EMERGENT_LLM_KEY
  - [ ] CORS_ORIGINS
  - [ ] PORT=8001

### Verificação
- [ ] Build concluído com sucesso
- [ ] Deploy status: "Active"
- [ ] URL pública gerada
- [ ] Logs não mostram erros críticos

### Atualizar Frontend
- [ ] Copiar URL do Railway
- [ ] Atualizar `frontend/.env`:
  ```
  REACT_APP_BACKEND_URL=https://seu-projeto.up.railway.app
  ```
- [ ] Commit e push
- [ ] Aguardar redeploy automático

### Teste Pós-Deploy
- [ ] Abrir URL do Railway
- [ ] Tela de login/registro aparece
- [ ] Criar conta de teste
- [ ] Login funciona
- [ ] API responde corretamente
- [ ] Posts aparecem no feed

---

## 🔧 Troubleshooting

### ❌ Build Failed

**Backend Build Error:**
- [ ] Verificar `requirements.txt` está correto
- [ ] Verificar Python version (3.11)
- [ ] Ver logs completos do build
- [ ] Verificar se todas dependências estão listadas

**Frontend Build Error:**
- [ ] Verificar `package.json` está correto
- [ ] Verificar Node version (18.x)
- [ ] Ver logs completos do build
- [ ] Tentar `yarn install` localmente

### ❌ Backend não inicia

- [ ] Verificar `MONGO_URL` está correta
- [ ] Testar conexão MongoDB (IP whitelist)
- [ ] Verificar todas variáveis de ambiente estão configuradas
- [ ] Ver logs do backend para erro específico
- [ ] Verificar porta está configurada ($PORT no Render/Railway)

### ❌ Frontend não conecta ao Backend

- [ ] Verificar `REACT_APP_BACKEND_URL` está correta
- [ ] URL deve ser a pública do backend (HTTPS)
- [ ] Não esquecer o protocolo (`https://`)
- [ ] Backend deve estar "Live" antes do frontend
- [ ] Verificar CORS está configurado corretamente
- [ ] Ver console do browser (F12) para erros de rede

### ❌ MongoDB Connection Error

- [ ] URL está no formato: `mongodb+srv://...`
- [ ] Senha foi substituída em `<password>`
- [ ] IP whitelist inclui `0.0.0.0/0` ou IPs específicos
- [ ] Cluster está ativo (não pausado)
- [ ] Usuário tem permissões corretas
- [ ] Database name está especificado na URL

### ❌ 502 Bad Gateway

- [ ] Aguardar alguns minutos (serviços demoram para iniciar)
- [ ] Verificar se backend está realmente rodando
- [ ] Ver logs para erros de startup
- [ ] Reiniciar serviços manualmente

---

## 🔐 Segurança (Produção)

- [ ] `JWT_SECRET` alterado para valor único e seguro
- [ ] `CORS_ORIGINS` configurado com URLs específicas (não `*`)
- [ ] MongoDB whitelist configurada (não `0.0.0.0/0`)
- [ ] Senhas fortes para MongoDB
- [ ] HTTPS habilitado (automático no Render/Railway)
- [ ] Variáveis sensíveis NÃO commitadas no Git
- [ ] `.env` adicionado ao `.gitignore`

---

## 📊 Monitoramento Pós-Deploy

### Primeiras 24h
- [ ] Verificar logs a cada 2-4 horas
- [ ] Confirmar que não há erros recorrentes
- [ ] Testar funcionalidades principais
- [ ] Verificar performance (tempo de resposta)
- [ ] Monitorar uso de recursos

### Primeira Semana
- [ ] Coletar feedback de usuários
- [ ] Identificar bugs críticos
- [ ] Verificar estabilidade do MongoDB
- [ ] Monitorar uso de armazenamento
- [ ] Otimizar queries lentas se necessário

---

## 🎉 Sucesso!

Se todos os itens acima estão marcados, sua aplicação está:
- ✅ **Deploy completo**
- ✅ **Funcionando corretamente**
- ✅ **Acessível publicamente**
- ✅ **Segura para uso**
- ✅ **Pronta para usuários**

---

## 📱 Compartilhar

Sua aplicação está no ar! Compartilhe:
- URL pública: `https://seu-app.onrender.com` ou `https://seu-app.up.railway.app`
- Com migrantes que precisam de ajuda
- Com voluntários que querem ajudar
- Em redes sociais
- Com organizações relevantes

---

## 📞 Suporte

Problemas? Recursos úteis:
- `python3 check_setup.py` - Verificar configuração
- `DEPLOY.md` - Guia completo de deploy
- `MONGODB_SETUP.md` - Configurar MongoDB
- `PLATFORM_SPECIFIC.md` - Detalhes por plataforma
- Logs da plataforma - Sempre verificar primeiro

---

**Parabéns pelo deploy! 🚀🎉**

*Agora é só cuidar da aplicação e ajudar quem precisa!*
