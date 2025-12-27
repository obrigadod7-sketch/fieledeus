# Testing Protocol - DO NOT EDIT THIS SECTION
# [Protocol content preserved from original]

#====================================================================================================
# Testing Data
#====================================================================================================

user_problem_statement: |
  1. Criar formulário de "Oferta de Ajuda Pública" com categorias, localização e upload de foto
  2. Criar "Mural de Mensagens" como um quadrado pequeno na área do feed
  3. Corrigir render.yaml para usar yarn ao invés de npm
  4. Test Housing/Hospedagem Solidária feature with backend APIs

backend:
  - task: "API endpoint GET /api/mural"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Endpoint retorna mensagens do mural corretamente"
      - working: true
        agent: "testing"
        comment: "Tested successfully - GET /api/mural returns messages with proper structure"

  - task: "API endpoint POST /api/mural"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Endpoint cria mensagens no mural com sucesso"
      - working: true
        agent: "testing"
        comment: "Tested successfully - POST /api/mural creates and persists messages correctly"

  - task: "Housing API endpoint GET /api/housing"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tested successfully - Returns list of housing listings with proper structure and user info"

  - task: "Housing API endpoint POST /api/housing"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tested successfully - Creates new housing listings with all required fields"

  - task: "Housing API endpoint GET /api/housing/{id}"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tested successfully - Returns detailed listing info including user contact details"

  - task: "Housing API filters GET /api/housing?type=offer"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tested successfully - Filters listings by type (offer/need) correctly"

  - task: "Housing API filters GET /api/housing?city=Paris"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tested successfully - Filters listings by city with case-insensitive regex matching"

  - task: "Authentication with test@test.com / test123"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tested successfully - Login works with test credentials, user created if not exists"

frontend:
  - task: "Formulário de Oferta de Ajuda Pública"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/VolunteersPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Modal abre ao clicar em 'Prefiro criar uma oferta pública' com todas as funcionalidades"

  - task: "Mural de Mensagens na Home"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/HomePage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Mural aparece na sidebar (desktop) e na área principal (mobile)"

config:
  - task: "render.yaml usando yarn"
    implemented: true
    working: true
    file: "/app/render.yaml"
    stuck_count: 0
    priority: "critical"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "buildCommand corrigido de 'npm install' para 'yarn install'"
      - working: true
        agent: "testing"
        comment: "Tested successfully - render.yaml uses 'yarn install' correctly"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Housing API endpoint GET /api/housing"
    - "Housing API endpoint POST /api/housing"
    - "Housing API endpoint GET /api/housing/{id}"
    - "Housing API filters GET /api/housing?type=offer"
    - "Housing API filters GET /api/housing?city=Paris"
    - "Authentication with test@test.com / test123"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "Housing/Hospedagem Solidária backend testing completed successfully. All 6 housing API endpoints are working correctly: GET /api/housing (list), POST /api/housing (create), GET /api/housing/{id} (details), filtering by type and city. Authentication with test@test.com works. Minor issue: help-locations/categories missing some categories (clothes, education, work) but this doesn't affect housing functionality. Overall success rate: 97.7% (43/44 tests passed)."
