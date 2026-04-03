# Como Rodar o FinControl

## Pré-requisitos

| Ferramenta | Versão mínima | Download |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Já vem com o Node.js |
| Conta no Supabase | — | [supabase.com](https://supabase.com) |
| Git | qualquer | [git-scm.com](https://git-scm.com) |

---

## 1. Clonar o repositório

```bash
git clone https://github.com/silvioitalo16/FinControl.git
cd FinControl
```

---

## 2. Instalar todas as dependências

Execute na raiz do projeto:

```bash
npm run install:all
```

Isso instala as dependências do **frontend** e do **backend** automaticamente.

---

## 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo na **raiz** do projeto e preencha:

```bash
cp .env.example .env
```

Abra `.env` e preencha todos os campos:

```env
# ── Frontend (Vite) ─────────────────────────────────────────
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key...
VITE_API_URL=http://localhost:3001

# ── Backend (Express) ────────────────────────────────────────
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...sua_service_role_key...
```

> **Onde encontrar as chaves:**
> - Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
> - Vá em **Project Settings → API**
> - `VITE_SUPABASE_ANON_KEY` → **anon key** (chave pública, segura para o frontend)
> - `SUPABASE_SERVICE_ROLE_KEY` → **service_role** (chave privada, **nunca exponha no frontend**)

> **Por que um único `.env`?**
> O Vite lê as variáveis `VITE_*` da raiz via `envDir`. O backend também carrega o `.env` da raiz via `dotenv`. Isso evita duplicar configurações.

---

## 4. Rodar o projeto

### Rodar tudo junto (recomendado)

```bash
npm run dev:all
```

Isso inicia o frontend e o backend em paralelo:

| Serviço | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

---

### Rodar separadamente

```bash
# Só o frontend
npm run dev:frontend

# Só o backend
npm run dev:backend
```

---

## 5. Estrutura do projeto

```
FinControl/
├── frontend/                  # App React
│   ├── src/
│   │   └── app/
│   │       ├── components/    # Componentes (charts, layout, shared)
│   │       ├── config/        # Constantes, query keys, rotas
│   │       ├── hooks/         # Hooks TanStack Query (useTransactions, useSalary...)
│   │       ├── lib/           # supabase.ts | queryClient.ts | logger.ts
│   │       ├── pages/         # Páginas da aplicação
│   │       ├── services/      # Chamadas ao Supabase
│   │       ├── stores/        # Estado global (Zustand)
│   │       ├── types/         # Tipos TypeScript + tipos do banco
│   │       ├── utils/         # Formatadores, cálculos, erros
│   │       └── validators/    # Schemas Zod (validação de forms)
│   └── package.json
│
├── backend/                   # API Node.js + Express
│   ├── src/
│   │   ├── config/env.ts      # Validação das variáveis de ambiente
│   │   ├── middleware/        # auth, requestLogger, errorHandler
│   │   ├── routes/            # /api/health | /api/logs
│   │   ├── services/          # Cliente Supabase admin
│   │   └── utils/logger.ts    # Winston (console + arquivo)
│   ├── logs/                  # Arquivos de log (gerados automaticamente)
│   └── package.json
│
├── supabase/
│   └── migrations/            # Migrações SQL do banco de dados
│       ├── 20260402000000_initial_schema.sql
│       ├── 20260402000001_add_salary_config.sql
│       └── 20260402000002_salary_tax_and_split.sql
├── .env.example               # Modelo de variáveis de ambiente (raiz)
└── package.json               # Scripts raiz
```

---

## 6. Scripts disponíveis

Todos executados na **raiz** do projeto:

| Comando | Descrição |
|---|---|
| `npm run install:all` | Instala deps do frontend e backend |
| `npm run dev:all` | Roda frontend + backend em paralelo |
| `npm run dev:frontend` | Só o frontend (porta 5173) |
| `npm run dev:backend` | Só o backend (porta 3001) |
| `npm run build` | Build de produção (frontend + backend) |
| `npm run build:frontend` | Build só do frontend |
| `npm run build:backend` | Build só do backend |

---

## 7. Logs

O backend gera logs automáticos em `backend/logs/`:

| Arquivo | Conteúdo |
|---|---|
| `combined-YYYY-MM-DD.log` | Todas as requisições (info, warn, error, http) |
| `error-YYYY-MM-DD.log` | Somente erros |

Os arquivos são rotacionados diariamente e comprimidos após 30 dias.

### Níveis de log disponíveis

| Nível | Quando aparece |
|---|---|
| `error` | Erros da aplicação |
| `warn` | Avisos e requisições lentas (> 2s) |
| `info` | Informações gerais (startup, etc.) |
| `http` | Todas as requisições HTTP |
| `debug` | Detalhes para depuração (só em dev) |

Para mudar o nível, edite `LOG_LEVEL` no `.env` (raiz do projeto).

---

## 8. Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Verifica status do servidor e banco |
| POST | `/api/logs` | Recebe logs de erro do frontend |

### Exemplo de resposta do health check

```json
{
  "status": "ok",
  "timestamp": "2026-04-03T14:00:00.000Z",
  "uptime": 120,
  "db": {
    "status": "ok",
    "latency_ms": 45
  }
}
```

---

## 9. Problemas comuns

### `SUPABASE_SERVICE_ROLE_KEY obrigatório`
O arquivo `.env` na raiz não foi criado ou está incompleto. Copie `.env.example` e preencha todas as variáveis (passo 3).

### Frontend abre mas não carrega dados
Verifique se `.env` existe na raiz e se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos.

### Porta 3001 já em uso
Mude o `PORT` no `.env` (raiz) e atualize o `VITE_API_URL` na mesma linha para a nova porta.

### `npm run install:all` falha no backend
Rode manualmente dentro da pasta:
```bash
cd backend
npm install
```
