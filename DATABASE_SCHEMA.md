# FinControl — Database Schema Reference

> PostgreSQL 16 + Supabase RLS | Versão 1.0

## Diagrama de Relacionamentos

```
auth.users (Supabase)
    │
    └── profiles (1:1)
            │
            ├── transactions (1:N) ──── categories (N:1) ──── categories
            │       └── transactions (parent_id, self-ref)
            │
            ├── goals (1:N)
            │       └── goal_contributions (1:N)
            │
            ├── budgets (1:N) ──────── categories (N:1)
            │
            ├── notifications (1:N)
            │
            ├── user_settings (1:1)
            │
            └── audit_logs (1:N)
```

## Regras de Integridade

| Regra | Implementação |
|---|---|
| Usuário vê só seus dados | RLS policy em todas as tabelas |
| amount sempre positivo | CHECK (amount > 0) |
| Tipo restrito | CHECK com enum values |
| Soft delete em transações | deleted_at TIMESTAMPTZ |
| updated_at automático | Trigger em todas as tabelas |
| Budget único por mês/categoria | UNIQUE(user_id, category_id, month) |

## Índices de Performance

```sql
-- Queries mais frequentes otimizadas:

-- Dashboard: saldo do mês
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, date DESC)
  WHERE deleted_at IS NULL;

-- Filtros de transações
CREATE INDEX idx_transactions_user_type
  ON transactions(user_id, type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_category
  ON transactions(user_id, category_id)
  WHERE deleted_at IS NULL;

-- Orçamentos do mês
CREATE INDEX idx_budgets_user_month
  ON budgets(user_id, month);

-- Objetivos ativos
CREATE INDEX idx_goals_user_status
  ON goals(user_id, status);

-- Notificações não lidas
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = FALSE;
```

## Trigger: updated_at automático

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas mutáveis:
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repetir para transactions, goals, budgets, user_settings)
```

## Trigger: recalcular spent_amount em budgets

```sql
CREATE OR REPLACE FUNCTION recalculate_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  v_month DATE;
  v_category_id UUID;
  v_user_id UUID;
BEGIN
  -- Funciona para INSERT, UPDATE e DELETE
  IF TG_OP = 'DELETE' THEN
    v_month := DATE_TRUNC('month', OLD.date);
    v_category_id := OLD.category_id;
    v_user_id := OLD.user_id;
  ELSE
    v_month := DATE_TRUNC('month', NEW.date);
    v_category_id := NEW.category_id;
    v_user_id := NEW.user_id;
  END IF;

  UPDATE budgets
  SET spent_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM transactions
    WHERE user_id = v_user_id
      AND category_id = v_category_id
      AND type = 'expense'
      AND DATE_TRUNC('month', date) = v_month
      AND deleted_at IS NULL
  )
  WHERE user_id = v_user_id
    AND category_id = v_category_id
    AND month = v_month;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_recalculate_budget
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION recalculate_budget_spent();
```

## Trigger: completar objetivo automaticamente

```sql
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se aporte levou ao 100%, marcar como completed
  IF NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount THEN
    NEW.status = 'completed';
    NEW.current_amount = NEW.target_amount;  -- Não ultrapassar

    -- Gerar notificação
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'goal',
      'Meta concluída!',
      'Parabéns! Você atingiu sua meta "' || NEW.name || '".',
      jsonb_build_object('goal_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_goal_completion
  BEFORE UPDATE OF current_amount ON goals
  FOR EACH ROW EXECUTE FUNCTION check_goal_completion();
```

## Seed: Categorias Padrão do Sistema

```sql
INSERT INTO categories (id, user_id, name, color, icon, type, is_default) VALUES
  (gen_random_uuid(), NULL, 'Alimentação',  '#10b981', 'UtensilsCrossed', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Transporte',   '#3b82f6', 'Car',             'expense', TRUE),
  (gen_random_uuid(), NULL, 'Moradia',      '#8b5cf6', 'Home',            'expense', TRUE),
  (gen_random_uuid(), NULL, 'Lazer',        '#f59e0b', 'Gamepad2',        'expense', TRUE),
  (gen_random_uuid(), NULL, 'Saúde',        '#ec4899', 'Heart',           'expense', TRUE),
  (gen_random_uuid(), NULL, 'Educação',     '#06b6d4', 'BookOpen',        'expense', TRUE),
  (gen_random_uuid(), NULL, 'Vestuário',    '#f97316', 'Shirt',           'expense', TRUE),
  (gen_random_uuid(), NULL, 'Outros',       '#6b7280', 'Package',         'both',    TRUE),
  (gen_random_uuid(), NULL, 'Salário',      '#10b981', 'Briefcase',       'income',  TRUE),
  (gen_random_uuid(), NULL, 'Freelance',    '#14b8a6', 'Laptop',          'income',  TRUE),
  (gen_random_uuid(), NULL, 'Investimentos',''#6366f1', 'TrendingUp',      'income',  TRUE),
  (gen_random_uuid(), NULL, 'Presente',     '#f59e0b', 'Gift',            'income',  TRUE);
```

## RLS Policies Completas

```sql
-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- ============================================================
-- CATEGORIES
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Pode ver: categorias globais (user_id IS NULL) + suas próprias
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE USING (user_id = auth.uid() AND is_default = FALSE)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_delete_own" ON categories
  FOR DELETE USING (user_id = auth.uid() AND is_default = FALSE);


-- ============================================================
-- TRANSACTIONS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sem DELETE real via API (só soft delete via UPDATE)


-- ============================================================
-- GOALS
-- ============================================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own" ON goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "goals_insert_own" ON goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_update_own" ON goals
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_delete_own" ON goals
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- GOAL_CONTRIBUTIONS
-- ============================================================
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_contributions_select_own" ON goal_contributions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "goal_contributions_insert_own" ON goal_contributions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goal_contributions_delete_own" ON goal_contributions
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- BUDGETS
-- ============================================================
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- INSERT apenas via triggers (SECURITY DEFINER) ou Edge Functions
-- Usuário não insere notificações diretamente

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());  -- Apenas marcar como lida

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- USER_SETTINGS
-- ============================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own" ON user_settings
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- AUDIT_LOGS (append-only: sem UPDATE, sem DELETE)
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver seus próprios logs, mas não criar via API direta
CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());
-- INSERT apenas via Edge Functions com SERVICE_ROLE
```

---

*FinControl Database Schema v1.0 — Abril 2026*
