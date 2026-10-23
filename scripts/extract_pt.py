import re, json, pathlib

ROOT = pathlib.Path('/app')
files = [p for p in (ROOT / 'frontend/src').rglob('*.js*') if '/ui/' not in str(p) and p.name != 'i18n.js']
files += [ROOT / 'backend/server.py', ROOT / 'backend/features.py']
PT_WORDS = r'\b(de|do|da|dos|das|para|com|não|você|seu|sua|uma|um|os|as|em|no|na|ao|por|mais|sem|ou|é|está|seus|suas|meu|minha|já|aqui|como|quando|onde|todos|todas|nenhum|nenhuma|Erro|Salvar|Enviar|Cancelar|Voltar|Buscar|Carregando|Publicar|Editar|Excluir|Ver|Sair|Entrar|Ajuda|Vagas?|Emprego|Moradia|Trabalho|Nome|Senha|Cidade|Endereço|Telefone|Descrição|Título|Categoria|Data|Horário|Aceitar|Recusar|Confirmar|Fechar|Abrir|Usuários?|Postagens?|Anúncios?|Mensagens?|Perfil|Configurações|Início|Todos|Ofertas?|Procuro|Ofereço|Preciso|Hoje|Ontem|Agora|Novo|Nova|Mapa|Igreja|Agenda|Encontros?|Voluntários?|Migrantes?|Associações?|Admin|Painel|Estatísticas)\b'
ACC = re.compile(r'[ãõçáéíóúâêôàÃÕÇÁÉÍÓÚÂÊÔ]')
PW = re.compile(PT_WORDS)
out = set()

def add(s):
    s = re.sub(r'\s+', ' ', s).strip()
    if len(s) < 2 or len(s) > 400:
        return
    if not re.search(r'[A-Za-zÀ-ÿ]', s):
        return
    if re.match(r'^[a-z0-9_\-./:#?=&]+$', s) or s.startswith(('http', '/', 'bg-', 'text-', 'flex', 'rounded', 'px-', 'w-', 'h-')):
        return
    if re.search(r'(className|=>|\bconst\b|\breturn\b|\{|\}|;)', s):
        return
    if ACC.search(s) or PW.search(s):
        out.add(s)

for f in files:
    src = f.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", src):
        add(m.group(1).replace("\\'", "'"))
    for m in re.finditer(r'"((?:[^"\\\n]|\\.)*)"', src):
        add(m.group(1))
    for m in re.finditer(r'`([^`]*)`', src):
        for part in re.split(r'\$\{[^}]*\}', m.group(1)):
            add(part)
    if f.suffix != '.py':
        for m in re.finditer(r'>([^<>{}]+)<', src):
            add(m.group(1))
        for m in re.finditer(r'>([^<>{}]+)\{', src):
            add(m.group(1))
        for m in re.finditer(r'\}([^<>{}]+)<', src):
            add(m.group(1))

json.dump(sorted(out), open('/app/scripts/pt_strings.json', 'w'), ensure_ascii=False, indent=0)
print(len(out))
