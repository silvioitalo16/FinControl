# FinControl — Arquitetura do Sistema

> Versão 1.0 | Abril 2026

---

## 1. Visão Geral

O FinControl é um sistema web de controle financeiro **multi-usuário**, projetado com foco em **segurança**, **escalabilidade** e **alto desempenho**. Cada usuário possui isolamento total de dados. O sistema suporta múltiplos perfis simultâneos com planos Free e Premium.

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                          │
│   React SPA + TanStack Query Cache + Zustand Store                 │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼─────────────────────────────────────────┐
│                        SUPABASE PLATFORM                           │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Auth (JWT)  │  │  PostgREST   │  │     Edge Functions       │ │
│  │  + OAuth2    │  │  (Auto API)  │  │  (Business Logic / CRON) │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Realtime   │  │   Storage    │  │       PostgreSQL          │ │
│  │ (WebSockets) │  │  (Avatars)   │  │   + RLS Policies         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Completa

### Frontend
| Tecnologia | Versão | Papel |
|---|---|---|
| React | 18.3.1 | UI Library |
| TypeScript | 5.x | Tipagem estática |
| Vite | 6.3.5 | Build tool + Dev server |
| React Router | 7.13.0 | Roteamento SPA |
| Tailwind CSS | 4.1.12 | Estilização |
| Recharts | 2.15.2 | Gráficos |
| Lucide React | 0.487.0 | Ícones |
| **Zustand** | 5.x | Estado global (auth, UI) |
| **TanStack Query** | 5.x | Estado servidor (cache + mutations) |
| **React Hook Form** | 7.x | Gerenciamento de formulários |
| **Zod** | 3.x | Validação de schemas |
| **date-fns** | 4.x | Manipulação de datas |

### Backend / Infra
| Tecnologia | Papel |
|---|---|
| Supabase Auth | Autenticação (email/senha + OAuth) |
| PostgreSQL 16 | Banco de dados relacional |
| Supabase PostgREST | API REST auto-gerada com RLS |
| Supabase Edge Functions | Lógica de negócio complexa (Deno/TS) |
| Supabase Realtime | Notificações em tempo real (WebSocket) |
| Supabase Storage | Upload de avatares |
| **Prisma** | ORM para migrations e type safety |

### Qualidade e DevOps
| Tecnologia | Papel |
|---|---|
| Vitest + React Testing Library | Testes unitários e de integração |
| Playwright | Testes E2E |
| ESLint + Prettier | Qualidade de código |
| Husky + lint-staged | Pre-commit hooks |
| GitHub Actions | CI/CD pipeline |
| Vercel | Hosting frontend |
| Sentry | Error tracking |

---

## 3. Requisitos Funcionais

### RF01 — Autenticação
- [ ] Registro com email/senha
- [ ] Login com email/senha
- [ ] Login com OAuth (Google, GitHub)
- [ ] Recuperação de senha (email)
- [ ] Autenticação em dois fatores (TOTP)
- [ ] Logout e invalidação de sessão
- [ ] Sessões ativas com gerenciamento

### RF02 — Dashboard
- [ ] Resumo de saldo atual (receitas - despesas)
- [ ] Gráfico receitas vs despesas (mensal)
- [ ] Gráfico de despesas por categoria (pizza)
- [ ] Transações recentes (últimas 5)
- [ ] Cards de métricas com variação percentual mensal
- [ ] Filtro por período

### RF03 — Transações
- [ ] Criar transação (receita ou despesa)
- [ ] Editar transação
- [ ] Excluir transação (soft delete)
- [ ] Listar transações com paginação (cursor-based)
- [ ] Filtrar por tipo, categoria, período, valor
- [ ] Buscar por descrição
- [ ] Transações recorrentes (semanal, mensal, anual)
- [ ] Exportar para CSV e PDF

### RF04 — Categorias
- [ ] Criar categoria personalizada (nome, cor, ícone, tipo)
- [ ] Editar/excluir categorias próprias
- [ ] Categorias padrão do sistema (não editáveis)
- [ ] Suporte a tipos: receita, despesa, ambos

### RF05 — Objetivos/Metas
- [ ] Criar objetivo (nome, valor-alvo, prazo, cor)
- [ ] Adicionar aportes ao objetivo
- [ ] Barra de progresso visual
- [ ] Status: ativo, concluído, cancelado
- [ ] Notificação ao atingir 100%

### RF06 — Planejamento (Orçamentos)
- [ ] Criar orçamento mensal por categoria
- [ ] Visualizar gasto atual vs planejado
- [ ] Alerta ao atingir 80% do orçamento
- [ ] Alerta ao ultrapassar o orçamento
- [ ] Histórico de orçamentos por mês

### RF07 — Notificações
- [ ] Notificações de sistema (orçamento excedido, meta atingida)
- [ ] Notificações em tempo real via WebSocket
- [ ] Marcar como lida / marcar todas como lidas
- [ ] Excluir notificações
- [ ] Filtrar por tipo e status (lida/não lida)
- [ ] Badge de contador no header

### RF08 — Perfil
- [ ] Editar informações pessoais
- [ ] Upload de foto de perfil
- [ ] Alterar senha
- [ ] Visualizar estatísticas do perfil
- [ ] Gerenciar plano (Free/Premium)

### RF09 — Configurações
- [ ] Modo escuro/claro + persistência
- [ ] Idioma (pt-BR inicial, i18n preparado)
- [ ] Preferências de notificações
- [ ] Ativar/desativar 2FA
- [ ] Gerenciar sessões ativas
- [ ] Exportar todos os dados (LGPD)
- [ ] Excluir conta com confirmação

### RF10 — Premium (Futuro)
- [ ] Relatórios avançados (anual, por categoria)
- [ ] Múltiplas moedas
- [ ] Integração bancária (Open Finance)
- [ ] Compartilhamento familiar (multi-conta)
- [ ] API access

---

## 4. Requisitos Não Funcionais

### RNF01 — Segurança
- Todas as queries ao banco passam por RLS (Row Level Security)
- JWT com expiração curta (1h) + refresh token rotation
- Rate limiting em todas as rotas de auth (5 tentativas/min)
- Inputs sanitizados via Zod antes de qualquer persistência
- Senhas nunca trafegam após o hash (Supabase Auth gerencia)
- Dados em trânsito: TLS 1.3 obrigatório
- Dados em repouso: criptografados pelo Supabase (AES-256)
- Audit log para ações sensíveis (exclusão de conta, exportação)
- Content Security Policy (CSP) headers configurados
- CORS restrito ao domínio de produção

### RNF02 — Performance
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3s
- Core Web Vitals na faixa "Good" (LCP, FID, CLS)
- Paginação cursor-based para listas grandes (não offset)
- Lazy loading de todas as páginas (code splitting por rota)
- TanStack Query com stale time e cache inteligente
- Imagens de avatar servidas via CDN (Supabase Storage + CDN)
- Bundle size < 300KB (gzipped) para o chunk inicial

### RNF03 — Escalabilidade
- Arquitetura stateless no frontend (estado em server + cache)
- Supabase escala automaticamente read replicas
- Edge Functions sem estado (escalam horizontalmente)
- Schema de banco preparado para particionamento por `user_id`
- Índices em todas as colunas de filtro frequente
- Estrutura modular: cada feature é isolada (pode ser extraída)

### RNF04 — Disponibilidade
- SLA alvo: 99.9% (compatível com Supabase Pro)
- Graceful degradation: UI funciona mesmo com API lenta
- Retry automático com exponential backoff (TanStack Query)
- Error boundaries em todas as páginas
- Loading states e skeletons em toda listagem

### RNF05 — Observabilidade
- Error tracking via Sentry (frontend + Edge Functions)
- Logs estruturados nas Edge Functions
- Métricas de performance via Vercel Analytics
- Alertas de latência e erros configurados

### RNF06 — Compliance (LGPD/GDPR)
- Usuário pode exportar todos os seus dados
- Usuário pode excluir conta (todos os dados removidos)
- Política de privacidade vinculada no cadastro
- Logs de auditoria mantidos por 90 dias

---

## 5. Regras de Negócio

### RN01 — Isolamento de Dados
- Um usuário **nunca** acessa dados de outro usuário
- Toda query é filtrada por `user_id` via RLS policy
- Categorias padrão são globais (`user_id IS NULL`), categorias customizadas pertencem ao usuário

### RN02 — Transações
- O campo `amount` é **sempre positivo** no banco; o tipo (`income`/`expense`) determina o sinal na UI
- Uma transação excluída recebe `deleted_at` (soft delete) — nunca é removida fisicamente
- Transações recorrentes geram cópias no mês seguinte via Edge Function (CRON diário)
- Não é possível criar transação com data futura maior que 1 ano

### RN03 — Categorias
- Ao excluir uma categoria customizada, suas transações são movidas para "Outros"
- Categorias padrão do sistema não podem ser editadas ou excluídas
- Limite de 50 categorias customizadas por usuário (Free: 10)

### RN04 — Metas/Objetivos
- `current_amount` nunca pode ser negativo
- `current_amount` nunca pode ultrapassar `target_amount`
- Ao atingir 100%, status muda automaticamente para `completed` e gera notificação
- Objetivo com prazo vencido e < 100% recebe status `expired` (não `cancelled`)

### RN05 — Orçamentos
- Um usuário pode ter apenas **um** orçamento por categoria por mês
- `spent_amount` é recalculado via trigger PostgreSQL sempre que uma transação do mês é inserida/editada/excluída
- Ao atingir 80% do orçamento, gera notificação de aviso
- Ao ultrapassar 100%, gera notificação de alerta (apenas 1 por orçamento por mês)

### RN06 — Planos
- Plano **Free**: até 100 transações/mês, 5 objetivos ativos, 10 categorias
- Plano **Premium**: ilimitado + relatórios avançados + exportação PDF + múltiplas moedas
- Downgrade de Premium para Free: dados existentes são mantidos (somente novos cadastros são bloqueados)

### RN07 — Notificações
- Notificações são imutáveis após criadas (não editáveis)
- Retenção de notificações: 90 dias
- Máximo de 500 notificações por usuário (as mais antigas são removidas)

---

## 6. Estrutura de Pastas — Frontend

```
fincontrol/
├── src/
│   ├── main.tsx                        # Entry point
│   └── app/
│       ├── App.tsx                     # Root com Providers
│       ├── routes.tsx                  # Rotas com lazy loading + ProtectedRoute
│       │
│       ├── components/
│       │   ├── ui/                     # Primitivos (shadcn-style, já existentes)
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── AppLayout.tsx       # Wrapper com Sidebar + Header
│       │   ├── charts/
│       │   │   ├── RevenueExpenseChart.tsx
│       │   │   └── CategoryPieChart.tsx
│       │   ├── transactions/
│       │   │   ├── TransactionItem.tsx
│       │   │   ├── TransactionForm.tsx
│       │   │   └── TransactionFilters.tsx
│       │   ├── goals/
│       │   │   ├── GoalCard.tsx
│       │   │   └── GoalForm.tsx
│       │   ├── budgets/
│       │   │   ├── BudgetCard.tsx
│       │   │   └── BudgetForm.tsx
│       │   └── shared/
│       │       ├── SummaryCard.tsx
│       │       ├── ProtectedRoute.tsx
│       │       ├── ErrorBoundary.tsx
│       │       └── LoadingSpinner.tsx
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── Login.tsx
│       │   │   ├── SignUp.tsx
│       │   │   ├── ForgotPassword.tsx
│       │   │   └── ResetPassword.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Transactions.tsx
│       │   ├── Goals.tsx
│       │   ├── Planning.tsx
│       │   ├── Profile.tsx
│       │   ├── Notifications.tsx
│       │   ├── Settings.tsx
│       │   └── NotFound.tsx
│       │
│       ├── services/                   # Abstração sobre Supabase
│       │   ├── supabase.ts             # Client singleton
│       │   ├── auth.service.ts
│       │   ├── transactions.service.ts
│       │   ├── categories.service.ts
│       │   ├── goals.service.ts
│       │   ├── budgets.service.ts
│       │   └── notifications.service.ts
│       │
│       ├── stores/                     # Zustand (estado global)
│       │   ├── auth.store.ts           # user, session, isLoading
│       │   ├── ui.store.ts             # sidebar, theme, language
│       │   └── notifications.store.ts  # unread count (realtime)
│       │
│       ├── hooks/                      # Hooks de domínio (TanStack Query)
│       │   ├── useAuth.ts
│       │   ├── useTransactions.ts
│       │   ├── useCategories.ts
│       │   ├── useGoals.ts
│       │   ├── useBudgets.ts
│       │   ├── useNotifications.ts
│       │   ├── useProfile.ts
│       │   └── utils/                  # useDebounce, useMediaQuery, etc.
│       │
│       ├── validators/                 # Schemas Zod
│       │   ├── auth.schema.ts
│       │   ├── transaction.schema.ts
│       │   ├── goal.schema.ts
│       │   ├── budget.schema.ts
│       │   └── profile.schema.ts
│       │
│       ├── types/                      # Interfaces TypeScript
│       │   ├── auth.types.ts
│       │   ├── transaction.types.ts
│       │   ├── category.types.ts
│       │   ├── goal.types.ts
│       │   ├── budget.types.ts
│       │   ├── notification.types.ts
│       │   └── index.ts               # Re-exports
│       │
│       ├── config/
│       │   ├── constants.ts
│       │   ├── queryKeys.ts           # TanStack Query keys centralizadas
│       │   └── routes.ts              # Constantes de rotas
│       │
│       └── utils/
│           ├── formatters.ts          # formatCurrency, formatDate
│           ├── calculations.ts        # percentages, totals
│           └── errors.ts             # parseSupabaseError
│
├── supabase/
│   ├── migrations/                    # Migrations versionadas
│   └── functions/                     # Edge Functions (Deno)
│       ├── process-recurring/         # CRON: gera transações recorrentes
│       ├── check-budgets/             # CRON: verifica alertas de orçamento
│       ├── export-data/               # Exportação CSV/PDF
│       └── _shared/                   # Utilitários compartilhados
│
└── prisma/
    └── schema.prisma                  # Schema para type generation + migrations
```

---

## 7. Fluxo de Dados

### Leitura (Query)
```
Page/Component
    │
    ▼
Custom Hook (useTransactions)          ← TanStack Query (cache + stale check)
    │ cache miss
    ▼
Service (transactions.service.ts)      ← Lógica de query + filtros
    │
    ▼
Supabase Client (supabase.ts)          ← .from('transactions').select()
    │
    ▼
PostgREST → PostgreSQL RLS             ← WHERE user_id = auth.uid()
    │
    ▼
Response → TanStack Query Cache → Component re-render
```

### Escrita (Mutation)
```
Form (react-hook-form + Zod validation)
    │ dados validados
    ▼
Custom Hook (useTransactions → mutation)
    │
    ▼
Service (transactions.service.ts)
    │
    ▼
Supabase Client → INSERT/UPDATE/DELETE
    │                    │
    ▼                    ▼
Optimistic Update   PostgreSQL Trigger
(UI imediata)       (recalcula spent_amount em budgets)
    │
    ▼
queryClient.invalidateQueries()        ← Invalida cache relacionado
```

### Notificações em Tempo Real
```
PostgreSQL Trigger → INSERT em notifications
    │
    ▼
Supabase Realtime (WebSocket)
    │
    ▼
notifications.store.ts (Zustand)       ← unreadCount++
    │
    ▼
Header badge atualiza automaticamente
```

---

## 8. Banco de Dados — Schema PostgreSQL

### Decisões de Design
- `UUID v4` como PK em todas as tabelas (não auto-increment) — evita enumeração
- `TIMESTAMPTZ` para todos os timestamps (fuso horário correto)
- Soft delete com `deleted_at` em transações
- Trigger para `updated_at` automático
- Índices compostos nas queries mais frequentes

### Tabelas

#### `profiles` (estende auth.users do Supabase)
```sql
id            UUID PK (FK auth.users.id)
full_name     TEXT NOT NULL
avatar_url    TEXT
phone         TEXT
birth_date    DATE
location      TEXT
plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium'))
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
```

#### `categories`
```sql
id            UUID PK DEFAULT gen_random_uuid()
user_id       UUID (FK profiles.id, NULL = categoria global)
name          TEXT NOT NULL
color         TEXT NOT NULL (hex color)
icon          TEXT NOT NULL (lucide icon name)
type          TEXT CHECK (type IN ('income', 'expense', 'both'))
is_default    BOOLEAN DEFAULT FALSE
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()

UNIQUE(user_id, name)
INDEX(user_id)
```

#### `transactions`
```sql
id                  UUID PK DEFAULT gen_random_uuid()
user_id             UUID NOT NULL (FK profiles.id)
category_id         UUID NOT NULL (FK categories.id)
description         TEXT NOT NULL
amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0)
type                TEXT NOT NULL CHECK (type IN ('income', 'expense'))
date                DATE NOT NULL
notes               TEXT
is_recurring        BOOLEAN DEFAULT FALSE
recurring_interval  TEXT CHECK (recurring_interval IN ('weekly','monthly','yearly'))
recurring_end_date  DATE
parent_id           UUID (FK transactions.id, para recorrentes)
deleted_at          TIMESTAMPTZ (soft delete)
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()

INDEX(user_id, date DESC)
INDEX(user_id, category_id)
INDEX(user_id, type)
INDEX(user_id, deleted_at) WHERE deleted_at IS NULL
```

#### `goals`
```sql
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID NOT NULL (FK profiles.id)
name            TEXT NOT NULL
target_amount   NUMERIC(12,2) NOT NULL CHECK (target_amount > 0)
current_amount  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0)
deadline        DATE
color           TEXT NOT NULL
icon            TEXT
status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','completed','expired','cancelled'))
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()

INDEX(user_id, status)
```

#### `goal_contributions`
```sql
id          UUID PK DEFAULT gen_random_uuid()
goal_id     UUID NOT NULL (FK goals.id ON DELETE CASCADE)
user_id     UUID NOT NULL (FK profiles.id)
amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0)
date        DATE NOT NULL DEFAULT CURRENT_DATE
notes       TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()

INDEX(goal_id)
INDEX(user_id)
```

#### `budgets`
```sql
id            UUID PK DEFAULT gen_random_uuid()
user_id       UUID NOT NULL (FK profiles.id)
category_id   UUID NOT NULL (FK categories.id)
planned_amount NUMERIC(12,2) NOT NULL CHECK (planned_amount > 0)
spent_amount  NUMERIC(12,2) NOT NULL DEFAULT 0  -- atualizado por trigger
month         DATE NOT NULL  -- sempre o primeiro dia do mês (ex: 2026-04-01)
alert_sent_80  BOOLEAN DEFAULT FALSE
alert_sent_100 BOOLEAN DEFAULT FALSE
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()

UNIQUE(user_id, category_id, month)
INDEX(user_id, month)
```

#### `notifications`
```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NOT NULL (FK profiles.id)
type        TEXT NOT NULL CHECK (type IN ('success','warning','info','goal','alert'))
title       TEXT NOT NULL
message     TEXT NOT NULL
is_read     BOOLEAN DEFAULT FALSE
metadata    JSONB  -- dados extras (ex: goal_id, budget_id)
created_at  TIMESTAMPTZ DEFAULT NOW()

INDEX(user_id, is_read)
INDEX(user_id, created_at DESC)
```

#### `user_settings`
```sql
id                    UUID PK DEFAULT gen_random_uuid()
user_id               UUID NOT NULL UNIQUE (FK profiles.id)
dark_mode             BOOLEAN DEFAULT FALSE
language              TEXT DEFAULT 'pt-BR'
email_notifications   BOOLEAN DEFAULT TRUE
push_notifications    BOOLEAN DEFAULT TRUE
transaction_alerts    BOOLEAN DEFAULT TRUE
goal_alerts           BOOLEAN DEFAULT TRUE
budget_alerts         BOOLEAN DEFAULT TRUE
two_factor_enabled    BOOLEAN DEFAULT FALSE
two_factor_secret     TEXT  -- criptografado, NUNCA exposto via API
created_at            TIMESTAMPTZ DEFAULT NOW()
updated_at            TIMESTAMPTZ DEFAULT NOW()
```

#### `audit_logs` (imutável)
```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NOT NULL
action      TEXT NOT NULL  -- ex: 'DELETE_ACCOUNT', 'EXPORT_DATA', 'CHANGE_PASSWORD'
ip_address  INET
user_agent  TEXT
metadata    JSONB
created_at  TIMESTAMPTZ DEFAULT NOW()

INDEX(user_id, created_at DESC)
```

---

## 9. Segurança — RLS Policies

Todas as tabelas têm RLS habilitado. Padrão: **negar tudo por default**, permitir apenas via policy explícita.

```sql
-- Exemplo: transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas suas transações não deletadas
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- INSERT: usuário insere apenas para si mesmo
CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: usuário edita apenas suas transações
CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: apenas soft delete (update deleted_at), nunca DELETE físico via API
-- A RLS de DELETE é desabilitada — uso via Edge Function privilegiada
```

### Campos Nunca Expostos via API
- `two_factor_secret` em `user_settings`
- `ip_address` em `audit_logs`
- Senhas (gerenciadas pelo Supabase Auth internamente)

---

## 10. Edge Functions (Supabase Deno)

### `process-recurring` (CRON: diário às 06:00)
- Busca transações com `is_recurring = true` e `date = hoje - 1 mês/semana/ano`
- Cria cópia para o período atual com `parent_id` apontando para a original
- Não duplica se já existir uma cópia no período

### `check-budgets` (CRON: diário às 08:00)
- Busca orçamentos do mês atual onde `spent_amount / planned_amount >= 0.8`
- Gera notificação se `alert_sent_80 = false`, marca como enviado
- Idem para 100% com `alert_sent_100`

### `export-data` (HTTP: chamada do frontend)
- Autenticação via JWT do usuário
- Gera CSV ou PDF de transações filtradas
- Retorna arquivo como blob para download
- Rate limit: 5 exports/hora por usuário

### `delete-account` (HTTP: chamada do frontend com confirmação)
- Autentica usuário, registra em `audit_logs`
- Remove todos os dados do usuário em cascata
- Chama `supabase.auth.admin.deleteUser(userId)` ao final

---

## 11. Estado no Frontend

### Zustand (estado global, síncrono)
```typescript
// auth.store.ts — dados da sessão
{ user, session, isAuthenticated, isLoading }

// ui.store.ts — preferências de UI
{ sidebarOpen, theme, language }

// notifications.store.ts — contador de não lidas (realtime)
{ unreadCount, setUnreadCount, increment, decrement }
```

### TanStack Query (estado de servidor, async)
```typescript
// Query Keys centralizadas (config/queryKeys.ts)
export const QUERY_KEYS = {
  transactions: (filters) => ['transactions', filters],
  goals: () => ['goals'],
  budgets: (month) => ['budgets', month],
  notifications: () => ['notifications'],
  profile: () => ['profile'],
  categories: () => ['categories'],
  dashboard: (period) => ['dashboard', period],
}
```

### Configuração global do QueryClient
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutos
      gcTime: 1000 * 60 * 30,       // 30 minutos no cache
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => toast.error(parseSupabaseError(error)),
    },
  },
})
```

---

## 12. Roteamento e Proteção de Rotas

```typescript
// routes.tsx
const router = createBrowserRouter([
  // Rotas públicas
  { path: '/', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // Rotas protegidas (requerem auth)
  {
    element: <ProtectedRoute />,       // Redireciona para '/' se não autenticado
    children: [
      {
        element: <AppLayout />,        // Sidebar + Header wrapper
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/transactions', element: <Transactions /> },
          { path: '/goals', element: <Goals /> },
          { path: '/planning', element: <Planning /> },
          { path: '/profile', element: <Profile /> },
          { path: '/notifications', element: <Notifications /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
```

### Lazy Loading por Rota
```typescript
// Cada página é um chunk separado
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
// ... todos os imports são lazy
```

---

## 13. Validação com Zod

```typescript
// validators/transaction.schema.ts
export const transactionSchema = z.object({
  description: z.string().min(3).max(100).trim(),
  amount: z.number().positive().max(999_999_999.99),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['weekly','monthly','yearly']).optional(),
})
.refine(
  data => !data.is_recurring || !!data.recurring_interval,
  { message: 'Intervalo obrigatório para recorrentes', path: ['recurring_interval'] }
)
```

A mesma validação Zod é importada nas Edge Functions (Deno suporta pacotes npm via esm.sh), garantindo validação dupla: frontend + backend.

---

## 14. Roadmap de Implementação

### Fase 1 — Fundação (Semana 1-2)
- [ ] Setup Supabase projeto + configuração inicial
- [ ] Migrations: criar todas as tabelas com RLS
- [ ] Categorias padrão via seed
- [ ] Setup frontend: instalar dependências adicionais (Zustand, TanStack Query, Zod, RHF, date-fns)
- [ ] `supabase.ts` client + `auth.store.ts`
- [ ] `ProtectedRoute` + `AppLayout`
- [ ] Fluxo completo de Auth (Login, SignUp, Logout, Recuperação de senha)

### Fase 2 — Core Features (Semana 3-4)
- [ ] CRUD Transações + serviço + hook + validação
- [ ] CRUD Categorias
- [ ] Dashboard com dados reais (substituir mock)
- [ ] Paginação cursor-based em Transactions

### Fase 3 — Features Secundárias (Semana 5-6)
- [ ] Goals + contributions
- [ ] Budgets + trigger de `spent_amount`
- [ ] Edge Function `check-budgets`
- [ ] Notificações em tempo real (Realtime WebSocket)

### Fase 4 — Perfil e Configurações (Semana 7)
- [ ] Upload de avatar (Supabase Storage)
- [ ] Alterar senha
- [ ] 2FA (TOTP)
- [ ] Configurações persistidas no banco
- [ ] Exportação CSV
- [ ] Excluir conta

### Fase 5 — Edge Functions e Recorrência (Semana 8)
- [ ] `process-recurring` CRON
- [ ] `export-data` com PDF
- [ ] `delete-account` com audit log

### Fase 6 — Qualidade (Semana 9-10)
- [ ] Testes unitários (hooks, utils, validators)
- [ ] Testes de integração (formulários, fluxos)
- [ ] Testes E2E (Playwright: auth, criar transação, dashboard)
- [ ] Lighthouse audit + otimizações de bundle
- [ ] Sentry setup

### Fase 7 — Deploy (Semana 11)
- [ ] GitHub Actions: lint + test + build
- [ ] Deploy Vercel (preview + production)
- [ ] Variáveis de ambiente seguras
- [ ] Domínio customizado + HTTPS
- [ ] Monitoring e alertas

---

## 15. Variáveis de Ambiente

```env
# Frontend (.env.local — NUNCA commitar)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx  # Chave pública (safe para expor no browser)

# Edge Functions (configuradas no Supabase Dashboard)
SUPABASE_SERVICE_ROLE_KEY=xxxx  # NUNCA expor no frontend
SENTRY_DSN=xxxx
```

### Regra de Ouro
- `ANON_KEY`: pode estar no frontend. A segurança é feita pelo RLS.
- `SERVICE_ROLE_KEY`: apenas em Edge Functions/servidor. Bypassa RLS — tratar como senha de root.

---

*FinControl Architecture v1.0 — Abril 2026*
