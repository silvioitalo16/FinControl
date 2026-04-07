# Como Rodar o FinControl

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|---|---|---|
| Node.js | 18+ | Recomendado usar a versão LTS |
| npm | 9+ | Já vem com o Node.js |
| Git | qualquer | Para clonar e publicar alterações |
| Conta no Supabase | ativa | Necessária para Auth, banco e Storage |

---

## 1. Clonar o repositório

```bash
git clone https://github.com/silvioitalo16/FinControl.git
cd FinControl
```

---

## 2. Instalar dependências

Na raiz do projeto:

```bash
npm run install:all
```

Esse comando instala as dependências do frontend e do backend.

---

## 3. Configurar variáveis de ambiente

Use o arquivo `.env.example` como referência.

### Frontend: `frontend/.env.local`

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key...
VITE_API_URL=http://localhost:3001
```

### Backend: `backend/.env.local`

```env
PORT=3001
APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...sua_service_role_key...
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=FinControl <onboarding@seudominio.com>
DATABASE_URL=postgresql://postgres.[ref]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[senha]@db.[ref].supabase.co:5432/postgres
```

Notas:
- O backend carrega primeiro `backend/.env.local` e usa `backend/.env` como fallback.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são obrigatórios para rodar a API.
- `APP_URL`, `RESEND_API_KEY` e `EMAIL_FROM` são necessários para os emails transacionais de cadastro, recuperação e aviso de troca de senha.
- `DATABASE_URL` e `DIRECT_URL` são usados principalmente para manutenção do schema via Prisma, introspecção e reconciliação do banco.
- No painel do Supabase, adicione `http://localhost:5173/dashboard` e `http://localhost:5173/reset-password` em `Auth` > `URL Configuration` > `Redirect URLs`.

Onde encontrar as chaves no Supabase:
- `VITE_SUPABASE_ANON_KEY`: `Project Settings` > `API` > `anon`
- `SUPABASE_SERVICE_ROLE_KEY`: `Project Settings` > `API` > `service_role`
- `DATABASE_URL` e `DIRECT_URL`: `Project Settings` > `Database` > `Connection string`

---

## 4. Rodar o projeto

### Tudo junto

```bash
npm run dev:all
```

Serviços:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

### Separado

```bash
npm run dev:frontend
npm run dev:backend
```

### Encerrar processos no Windows

Se ficar algum Vite ou backend pendurado:

```powershell
.\stop-all.ps1
```

Esse script tenta encerrar os processos do frontend na porta `5173`, do backend na `3001` e também `node.exe` residual ligado ao projeto.

---

## 5. Estrutura atual do projeto

```text
FinControl/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   └── app/
│   │       ├── components/
│   │       ├── config/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── pages/
│   │       ├── routes.tsx
│   │       ├── services/
│   │       ├── stores/
│   │       ├── types/
│   │       ├── utils/
│   │       └── validators/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 20260402000000_initial_schema.sql
│   │   │   ├── 20260402000001_add_salary_config.sql
│   │   │   ├── 20260402000002_salary_tax_and_split.sql
│   │   │   ├── 20260406000000_salary_fixed_first_payment.sql
│   │   │   └── 20260406190000_reconcile_salary_schema.sql
│   │   └── prisma/
│   │       └── schema.prisma
│   └── package.json
├── .env.example
├── ARCHITECTURE.md
├── COMO_RODAR.md
├── DATABASE_SCHEMA.md
├── package.json
└── stop-all.ps1
```

---

## 6. Scripts principais

### Na raiz

| Comando | Descrição |
|---|---|
| `npm run install:all` | Instala frontend e backend |
| `npm run dev:all` | Sobe frontend e backend em paralelo |
| `npm run dev:frontend` | Sobe só o frontend |
| `npm run dev:backend` | Sobe só o backend |
| `npm run build` | Build frontend + backend |
| `npm run build:frontend` | Build só do frontend |
| `npm run build:backend` | Build só do backend |
| `npm run lint:frontend` | Executa o lint do frontend |
| `npm run lint:backend` | Executa `tsc --noEmit` no backend |

### No frontend

| Comando | Descrição |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript sem emitir arquivos |

### No backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Backend com `tsx watch` |
| `npm run build` | Build com `tsup` |
| `npm run start` | Executa o build |
| `npm run lint` | TypeScript sem emitir arquivos |
| `npm run generate` | Regenera o Prisma Client |
| `npm run db:pull` | Introspecção do banco no `schema.prisma` |

---

## 7. Logs

O backend gera logs em `backend/logs/` com rotação diária.

Arquivos esperados:
- `combined-YYYY-MM-DD.log`
- `error-YYYY-MM-DD.log`

Níveis suportados pelo backend:
- `error`
- `warn`
- `info`
- `http`
- `debug`

---

## 8. Endpoints disponíveis hoje

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verifica servidor e acesso ao Supabase |
| `POST` | `/api/logs` | Recebe logs do frontend |

Exemplo de resposta de `/api/health`:

```json
{
  "status": "ok",
  "timestamp": "2026-04-06T14:00:00.000Z",
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

O backend não encontrou `backend/.env.local` nem `backend/.env` com as variáveis necessárias.

### Frontend abre mas não carrega dados

Verifique:
- `frontend/.env.local`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Porta 3001 já em uso

Altere:
- `PORT` no backend
- `VITE_API_URL` no frontend

Se sobrar processo antigo no Windows, rode:

```powershell
.\stop-all.ps1
```

### `npm run db:pull` não consegue conectar no Supabase

Isso normalmente indica:
- `DIRECT_URL` ausente ou incorreta
- acesso bloqueado à conexão direta do banco
- projeto Supabase pausado ou inacessível

### `prisma generate` falha com schema inválido

Verifique se `backend/supabase/prisma/schema.prisma` está salvo em UTF-8 sem BOM.
