# FinControl - Arquitetura do Sistema

> Documento atualizado para refletir o estado real do repositório em abril de 2026.

## Status do documento

Este arquivo descreve dois níveis de informação:
- implementação atual: o que já existe no repositório hoje
- roadmap: o que ainda faz parte da visão do produto, mas não está necessariamente versionado nem operacional

Quando houver dúvida entre este documento e o código, o código e o schema versionado prevalecem.

---

## 1. Visão geral

O FinControl é uma aplicação web de controle financeiro multiusuário baseada em Supabase.

Arquitetura atual:
- frontend React/Vite consumindo Supabase diretamente para dados de domínio
- backend Express para health check, ingestão de logs do frontend e utilitários internos
- PostgreSQL no Supabase com RLS, triggers e RPCs para parte da lógica de negócio
- Prisma no backend como espelho do schema e client tipado, com migrations SQL versionadas separadamente

---

## 2. Stack realmente presente no repositório

### Frontend

| Tecnologia | Versão | Papel |
|---|---|---|
| React | 18.3.1 | UI |
| TypeScript | 5.8.x | Tipagem |
| Vite | 6.3.5 | Build e dev server |
| React Router | 7.13.0 | Rotas |
| Tailwind CSS | 4.1.12 | Estilo |
| TanStack Query | 5.74.x | Cache e mutations |
| Zustand | 5.0.x | Estado global |
| React Hook Form | 7.55.x | Forms |
| Zod | 3.24.x | Validação |
| date-fns | 3.6.0 | Datas |
| Recharts | 2.15.x | Gráficos |
| Lucide React | 0.487.x | Ícones |
| Sonner | 2.0.x | Toasts |

### Backend

| Tecnologia | Versão | Papel |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.21.x | API auxiliar |
| TypeScript | 5.8.x | Tipagem |
| Supabase JS | 2.49.x | Cliente admin |
| Prisma Client | 5.22.x | Acesso tipado ao schema |
| Prisma CLI | 5.22.x | Generate / introspecção |
| Winston | 3.17.x | Logs |
| tsup | 8.4.x | Build |
| tsx | 4.19.x | Dev server |

### Infra atual

| Tecnologia | Papel |
|---|---|
| Supabase Auth | autenticação |
| Supabase PostgREST | acesso REST ao banco |
| Supabase Realtime | notificações em tempo real |
| Supabase Storage | upload de avatar |
| PostgreSQL | persistência principal |

---

## 3. Ferramentas ainda não configuradas no repositório

Os itens abaixo aparecem em versões antigas desta documentação, mas não estão configurados no projeto neste momento:
- Vitest
- Playwright
- Husky
- lint-staged
- GitHub Actions
- Sentry
- Vercel
- Edge Functions versionadas no repositório

Eles continuam sendo opções futuras, não dependências ativas da base atual.

---

## 4. Estrutura real de pastas

```text
FinControl/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   └── app/
│   │       ├── App.tsx
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
│   │   └── prisma/
│   └── package.json
├── ARCHITECTURE.md
├── COMO_RODAR.md
├── DATABASE_SCHEMA.md
└── stop-all.ps1
```

---

## 5. Fluxo atual de dados

### Leitura

```text
Page
  -> hook de domínio (TanStack Query)
  -> service
  -> supabase client
  -> PostgREST / PostgreSQL com RLS
  -> cache do TanStack Query
  -> re-render da UI
```

### Escrita

```text
Form (react-hook-form + Zod)
  -> mutation hook
  -> service
  -> Supabase INSERT / UPDATE / DELETE
  -> triggers / constraints no PostgreSQL
  -> invalidateQueries
  -> atualização da UI
```

### Notificações em tempo real

```text
INSERT em notifications
  -> Supabase Realtime
  -> hooks/useNotifications.ts
  -> notifications.store.ts
  -> badge e toasts na UI
```

---

## 6. Módulos de frontend implementados hoje

Rotas públicas:
- `/`
- `/signup`
- `/forgot-password`
- `/reset-password`

Rotas protegidas:
- `/dashboard`
- `/transactions`
- `/goals`
- `/planning`
- `/profile`
- `/notifications`
- `/settings`

Principais serviços já existentes:
- `auth.service.ts`
- `transactions.service.ts`
- `categories.service.ts`
- `goals.service.ts`
- `budgets.service.ts`
- `notifications.service.ts`
- `profile.service.ts`
- `salary.service.ts`

---

## 7. Backend implementado hoje

O backend atual é enxuto e expõe principalmente:
- `GET /api/health`
- `POST /api/logs`

Também mantém:
- validação de ambiente em `backend/src/config/env.ts`
- cliente admin do Supabase em `backend/src/services/supabase.ts`
- cliente Prisma em `backend/src/services/prisma.ts`
- logging estruturado com Winston

Ele não substitui o Supabase para o CRUD principal da aplicação; esse tráfego ainda acontece majoritariamente direto do frontend para o Supabase.

---

## 8. Banco e schema

O schema vigente inclui hoje:
- profiles
- categories
- transactions
- goals
- goal_contributions
- budgets
- notifications
- user_settings
- audit_logs
- salary_configs

Também existem triggers e funções importantes, como:
- `update_updated_at()`
- `handle_new_user()`
- `handle_new_profile()`
- `check_goal_completion()`
- `recalculate_budget_spent()`
- `get_salary_status()`

Para a referência detalhada do banco, consulte `DATABASE_SCHEMA.md`.

---

## 9. Prisma no projeto

O Prisma não é a fonte de migrations deste repositório.

Uso atual:
- `schema.prisma` espelha o banco atual
- `prisma generate` regenera o client usado no backend
- `prisma db pull` serve para introspecção
- a evolução do banco é feita por SQL versionado em `backend/supabase/migrations/`

---

## 10. Estado atual vs roadmap

### Já implementado no repositório
- autenticação com páginas dedicadas
- dashboard
- transações
- metas
- planejamento/orçamentos
- notificações
- perfil
- configurações
- salary config com RPC `get_salary_status`
- logs no backend
- scripts de desenvolvimento e encerramento local

### Ainda como roadmap ou fora do repositório
- Edge Functions versionadas localmente
- automações CRON no código do projeto
- suíte de testes automatizados
- CI/CD com GitHub Actions
- deploy documentado de produção
- observabilidade com Sentry
- fluxo completo de 2FA em produção

---

## 11. Decisões de arquitetura que continuam válidas

- isolamento de dados por RLS no Supabase
- frontend orientado a hooks de domínio
- validação com Zod antes de persistência
- soft delete em transações
- cache e invalidação via TanStack Query
- serviços de domínio encapsulando acesso ao Supabase
- backend separado para responsabilidades auxiliares e administrativas

---

## 12. Observação final

Versões anteriores deste documento misturavam estrutura real, desejos de produto e stack futura como se tudo já estivesse presente. A partir desta revisão, a intenção é manter explícita a diferença entre implementação atual e roadmap.