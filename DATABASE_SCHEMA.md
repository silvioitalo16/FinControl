# FinControl - Database Schema Reference

> Estado atual do projeto em abril de 2026.

## Visão geral

O banco do FinControl roda no Supabase/PostgreSQL e usa RLS para isolamento por usuário.

Fontes de verdade do schema:
- `backend/supabase/migrations/*.sql`: histórico SQL versionado
- `backend/supabase/prisma/schema.prisma`: espelho do schema para type generation e acesso no backend
- projeto Supabase ativo: estado efetivamente aplicado no banco

Atualmente o diretório de migrations contém:
- `20260402000000_initial_schema.sql`
- `20260402000001_add_salary_config.sql`
- `20260402000002_salary_tax_and_split.sql`
- `20260406000000_salary_fixed_first_payment.sql`
- `20260406190000_reconcile_salary_schema.sql`

---

## Relacionamentos principais

```text
auth.users
    └── profiles (1:1)
         ├── categories (1:N customizadas; sistema usa user_id NULL)
         ├── transactions (1:N)
         │   └── transactions.parent_id (self reference)
         ├── goals (1:N)
         │   └── goal_contributions (1:N)
         ├── budgets (1:N)
         ├── notifications (1:N)
         ├── user_settings (1:1)
         ├── audit_logs (1:N)
         └── salary_configs (1:N, com apenas uma ativa por usuário)
```

---

## Regras importantes

| Regra | Implementação atual |
|---|---|
| Usuário vê apenas seus próprios dados | RLS em todas as tabelas de domínio |
| `amount` sempre positivo | `CHECK (amount > 0)` em tabelas financeiras |
| Soft delete de transações | `deleted_at TIMESTAMPTZ` |
| `updated_at` automático | trigger `update_updated_at()` |
| Um orçamento por categoria/mês | `UNIQUE(user_id, category_id, month)` |
| Apenas uma configuração salarial ativa | índice parcial único em `salary_configs(user_id)` quando `active = true` |

---

## Índices principais

```sql
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_type
  ON transactions(user_id, type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_category
  ON transactions(user_id, category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_goals_user_status
  ON goals(user_id, status);

CREATE INDEX idx_budgets_user_month
  ON budgets(user_id, month);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = FALSE;

CREATE UNIQUE INDEX salary_configs_one_active
  ON salary_configs(user_id)
  WHERE active = TRUE;

CREATE INDEX idx_salary_configs_user
  ON salary_configs(user_id, active);
```

---

## Tabelas atuais

### `profiles`

```sql
id          UUID PK REFERENCES auth.users(id)
full_name   TEXT NOT NULL DEFAULT ''
avatar_url  TEXT
phone       TEXT
birth_date  DATE
location    TEXT
plan        TEXT NOT NULL DEFAULT 'free'
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `categories`

```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NULL REFERENCES profiles(id)
name        TEXT NOT NULL
color       TEXT NOT NULL DEFAULT '#6b7280'
icon        TEXT NOT NULL DEFAULT 'Package'
type        TEXT NOT NULL CHECK (type IN ('income','expense','both'))
is_default  BOOLEAN NOT NULL DEFAULT FALSE
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `transactions`

```sql
id                  UUID PK DEFAULT gen_random_uuid()
user_id             UUID NOT NULL REFERENCES profiles(id)
category_id         UUID NOT NULL REFERENCES categories(id)
type                TEXT NOT NULL CHECK (type IN ('income','expense'))
amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0)
description         TEXT NOT NULL DEFAULT ''
notes               TEXT
date                DATE NOT NULL
is_recurring        BOOLEAN NOT NULL DEFAULT FALSE
recurring_interval  TEXT CHECK (recurring_interval IN ('weekly','monthly','yearly'))
recurring_end_date  DATE
parent_id           UUID REFERENCES transactions(id)
deleted_at          TIMESTAMPTZ
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `goals`

```sql
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES profiles(id)
name            TEXT NOT NULL
target_amount   NUMERIC(12,2) NOT NULL CHECK (target_amount > 0)
current_amount  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0)
deadline        DATE
color           TEXT NOT NULL DEFAULT '#10b981'
icon            TEXT DEFAULT 'Target'
status          TEXT NOT NULL DEFAULT 'active'
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Valores usados hoje para `status`:
- `active`
- `completed`
- `expired`
- `cancelled`

### `goal_contributions`

```sql
id          UUID PK DEFAULT gen_random_uuid()
goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE
user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0)
notes       TEXT
date        DATE NOT NULL DEFAULT CURRENT_DATE
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `budgets`

```sql
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES profiles(id)
category_id     UUID NOT NULL REFERENCES categories(id)
month           DATE NOT NULL
planned_amount  NUMERIC(12,2) NOT NULL CHECK (planned_amount > 0)
spent_amount    NUMERIC(12,2) NOT NULL DEFAULT 0
alert_sent_80   BOOLEAN NOT NULL DEFAULT FALSE
alert_sent_100  BOOLEAN NOT NULL DEFAULT FALSE
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE(user_id, category_id, month)
```

### `notifications`

```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES profiles(id)
type        TEXT NOT NULL
title       TEXT NOT NULL
message     TEXT NOT NULL
metadata    JSONB
is_read     BOOLEAN NOT NULL DEFAULT FALSE
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Tipos consumidos atualmente pelo frontend:
- `success`
- `warning`
- `info`
- `goal`
- `alert`

### `user_settings`

```sql
id                    UUID PK DEFAULT gen_random_uuid()
user_id               UUID NOT NULL UNIQUE REFERENCES profiles(id)
push_notifications    BOOLEAN NOT NULL DEFAULT TRUE
email_notifications   BOOLEAN NOT NULL DEFAULT TRUE
transaction_alerts    BOOLEAN NOT NULL DEFAULT TRUE
budget_alerts         BOOLEAN NOT NULL DEFAULT TRUE
goal_alerts           BOOLEAN NOT NULL DEFAULT TRUE
dark_mode             BOOLEAN NOT NULL DEFAULT FALSE
language              TEXT NOT NULL DEFAULT 'pt-BR'
two_factor_enabled    BOOLEAN NOT NULL DEFAULT FALSE
two_factor_secret     TEXT
created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `audit_logs`

```sql
id          UUID PK DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES profiles(id)
action      TEXT NOT NULL
metadata    JSONB
ip_address  INET
user_agent  TEXT
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `salary_configs`

```sql
id                         UUID PK DEFAULT gen_random_uuid()
user_id                    UUID NOT NULL REFERENCES profiles(id)
name                       TEXT NOT NULL DEFAULT 'Salário'
active                     BOOLEAN NOT NULL DEFAULT TRUE
amount                     NUMERIC(12,2) NOT NULL
tax_mode                   TEXT NOT NULL DEFAULT 'net'
gross_amount               NUMERIC(12,2)
inss_amount                NUMERIC(12,2) NOT NULL DEFAULT 0
irrf_amount                NUMERIC(12,2) NOT NULL DEFAULT 0
other_deductions           NUMERIC(12,2) NOT NULL DEFAULT 0
other_deductions_label     TEXT
payment_type               TEXT NOT NULL
payment_day                INTEGER
payment_day_2              INTEGER
payment_split_percent      INTEGER NOT NULL DEFAULT 50
payment_fixed_first_amount NUMERIC(12,2)
custom_interval_days       INTEGER
custom_start_date          DATE
created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Valores usados hoje:
- `tax_mode`: `net`, `gross_auto`, `gross_manual`
- `payment_type`: `monthly`, `biweekly`, `custom`

---

## Triggers e funções relevantes

### `update_updated_at()`

Atualiza `updated_at` automaticamente nas tabelas mutáveis.

### `handle_new_user()`

Cria um registro em `profiles` quando um usuário novo entra em `auth.users`.

### `handle_new_profile()`

Cria `user_settings` automaticamente quando um `profile` é criado.

### `check_goal_completion()`

Marca metas como `completed` quando o valor atinge 100% e gera notificação.

### `recalculate_budget_spent()`

Recalcula `spent_amount` dos budgets a partir das transações e dispara alertas de orçamento.

### `get_salary_status()`

RPC usada pela tela de planejamento salarial.

Ela retorna, entre outros campos:
- `config_id`
- `name`
- `salary_amount`
- `gross_amount`
- `inss_amount`
- `irrf_amount`
- `other_deductions`
- `other_deductions_label`
- `tax_mode`
- `payment_type`
- `payment_split_percent`
- `period_start`
- `period_end`
- `total_spent`
- `remaining`

---

## Seed de categorias padrão

O projeto usa categorias globais (`user_id = NULL`) para a base inicial. Exemplos:
- Alimentação
- Transporte
- Moradia
- Lazer
- Saúde
- Educação
- Vestuário
- Outros
- Salário
- Freelance
- Investimentos
- Presente

---

## RLS

Todas as tabelas de domínio usam Row Level Security.

Padrão aplicado:
- leitura restrita ao `auth.uid()` do usuário
- escrita restrita aos próprios registros
- categorias globais acessíveis via `user_id IS NULL`
- `audit_logs` é append-only do ponto de vista da aplicação

As policies SQL completas continuam versionadas nas migrations em `backend/supabase/migrations/`.