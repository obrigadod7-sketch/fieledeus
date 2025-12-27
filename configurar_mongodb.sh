#!/bin/bash

# Script interativo para configurar MongoDB Atlas

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 Configurador MongoDB Atlas - Watizat                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Função para exibir mensagens coloridas
show_step() {
    echo -e "\n📌 $1"
}

show_success() {
    echo -e "✅ $1"
}

show_error() {
    echo -e "❌ $1"
}

show_info() {
    echo -e "ℹ️  $1"
}

# Verificar se arquivo .env existe
if [ ! -f "/app/backend/.env" ]; then
    show_error "Arquivo .env não encontrado!"
    echo "Criando arquivo .env..."
    touch /app/backend/.env
fi

show_step "Verificando configuração atual..."

# Ler MONGO_URL atual
CURRENT_URL=$(grep "^MONGO_URL=" /app/backend/.env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -n "$CURRENT_URL" ]; then
    # Esconder senha
    SAFE_URL=$(echo "$CURRENT_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
    show_info "MONGO_URL atual: $SAFE_URL"
else
    show_info "MONGO_URL não configurado ainda"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Escolha uma opção:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1) 📝 Configurar MongoDB Atlas (Cloud - Recomendado)"
echo "  2) 💻 Usar MongoDB Local (já instalado)"
echo "  3) 🧪 Testar conexão atual"
echo "  4) 📚 Abrir guia completo"
echo "  5) ❌ Sair"
echo ""

read -p "Escolha (1-5): " choice

case $choice in
    1)
        show_step "Configurando MongoDB Atlas..."
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  📋 INSTRUÇÕES:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Vá para: https://www.mongodb.com/cloud/atlas/register"
        echo "2. Crie sua conta gratuita"
        echo "3. Crie um cluster M0 (gratuito)"
        echo "4. Configure usuário e senha"
        echo "5. Libere acesso: 0.0.0.0/0"
        echo "6. Copie a Connection String"
        echo ""
        echo "📚 Guia detalhado: cat /app/PASSO_A_PASSO_MONGODB.md"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        read -p "Você já tem a Connection String? (s/n): " has_string
        
        if [ "$has_string" = "s" ] || [ "$has_string" = "S" ]; then
            echo ""
            echo "Cole sua Connection String completa:"
            echo "(Formato: mongodb+srv://user:senha@cluster.mongodb.net/watizat_db)"
            echo ""
            read -p "Connection String: " mongo_url
            
            # Validar formato básico
            if [[ $mongo_url == mongodb+srv://* ]] || [[ $mongo_url == mongodb://* ]]; then
                # Backup do .env original
                cp /app/backend/.env /app/backend/.env.backup
                
                # Atualizar .env
                if grep -q "^MONGO_URL=" /app/backend/.env; then
                    sed -i "s|^MONGO_URL=.*|MONGO_URL=$mongo_url|" /app/backend/.env
                else
                    echo "MONGO_URL=$mongo_url" >> /app/backend/.env
                fi
                
                show_success "MONGO_URL configurado!"
                show_info "Backup salvo em: /app/backend/.env.backup"
                
                echo ""
                read -p "Deseja testar a conexão agora? (s/n): " test_now
                
                if [ "$test_now" = "s" ] || [ "$test_now" = "S" ]; then
                    echo ""
                    show_step "Testando conexão..."
                    python3 /app/check_mongodb.py
                    
                    if [ $? -eq 0 ]; then
                        echo ""
                        show_success "Tudo certo! Reiniciando backend..."
                        sudo supervisorctl restart backend
                        show_success "Backend reiniciado!"
                    fi
                fi
            else
                show_error "Formato inválido!"
                echo "A URL deve começar com mongodb:// ou mongodb+srv://"
            fi
        else
            echo ""
            show_info "Sem problemas! Siga o guia passo a passo:"
            echo ""
            echo "  📄 Guia completo: PASSO_A_PASSO_MONGODB.md"
            echo "  ⚡ Guia rápido: MONGODB_ATLAS_SIMPLES.md"
            echo ""
            echo "Depois execute novamente este script!"
        fi
        ;;
        
    2)
        show_step "Configurando MongoDB Local..."
        
        # Verificar se MongoDB está rodando
        if pgrep -x "mongod" > /dev/null; then
            show_success "MongoDB local já está rodando!"
        else
            show_info "Iniciando MongoDB local..."
            sudo supervisorctl start mongodb
            sleep 2
        fi
        
        # Configurar .env
        LOCAL_URL="mongodb://localhost:27017/watizat_db"
        
        if grep -q "^MONGO_URL=" /app/backend/.env; then
            sed -i "s|^MONGO_URL=.*|MONGO_URL=$LOCAL_URL|" /app/backend/.env
        else
            echo "MONGO_URL=$LOCAL_URL" >> /app/backend/.env
        fi
        
        show_success "Configurado para usar MongoDB local!"
        
        echo ""
        show_step "Testando conexão..."
        python3 /app/check_mongodb.py
        
        if [ $? -eq 0 ]; then
            echo ""
            show_success "Reiniciando backend..."
            sudo supervisorctl restart backend
            show_success "Pronto! Backend usando MongoDB local."
        fi
        ;;
        
    3)
        show_step "Testando conexão MongoDB..."
        echo ""
        python3 /app/check_mongodb.py
        ;;
        
    4)
        show_step "Abrindo guia..."
        echo ""
        echo "Guias disponíveis:"
        echo ""
        echo "  📘 Guia Passo a Passo (Completo):"
        echo "     cat /app/PASSO_A_PASSO_MONGODB.md"
        echo ""
        echo "  ⚡ Guia Rápido (5 minutos):"
        echo "     cat /app/MONGODB_ATLAS_SIMPLES.md"
        echo ""
        echo "  🔧 Guia de Deploy:"
        echo "     cat /app/DEPLOY.md"
        echo ""
        
        read -p "Deseja abrir o guia passo a passo? (s/n): " open_guide
        
        if [ "$open_guide" = "s" ] || [ "$open_guide" = "S" ]; then
            less /app/PASSO_A_PASSO_MONGODB.md
        fi
        ;;
        
    5)
        show_info "Até logo!"
        exit 0
        ;;
        
    *)
        show_error "Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Configuração concluída!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Próximos passos:"
echo ""
echo "  • Acessar aplicativo: https://job-alert-system-2.preview.emergentagent.com"
echo "  • Verificar status: sudo supervisorctl status"
echo "  • Ver logs backend: tail -f /var/log/supervisor/backend.out.log"
echo "  • Testar MongoDB: python3 /app/check_mongodb.py"
echo ""
