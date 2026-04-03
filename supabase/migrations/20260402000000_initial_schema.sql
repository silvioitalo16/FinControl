-- ============================================================
--  FinControl — Schema Inicial
--  Migration: 20260402000000_initial_schema
-- ============================================================

-- ── Função updated_at automático ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT        NOT NULL DEFAULT '',
  avatar_url   TEXT,
  phone        TEXT,
  birth_date   DATE,
  location     TEXT,
  plan         TEXT        NOT NULL DEFAULT 'free',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#6b7280',
  icon        TEXT        NOT NULL DEFAULT 'Package',
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select"      ON categories FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "categories_insert_own"  ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update_own"  ON categories FOR UPDATE USING (user_id = auth.uid() AND is_default = FALSE) WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_delete_own"  ON categories FOR DELETE USING (user_id = auth.uid() AND is_default = FALSE);

-- Seed: categorias padrão do sistema
INSERT INTO categories (user_id, name, color, icon, type, is_default) VALUES
  (NULL, 'Alimentação',   '#10b981', 'UtensilsCrossed', 'expense', TRUE),
  (NULL, 'Transporte',    '#3b82f6', 'Car',             'expense', TRUE),
  (NULL, 'Moradia',       '#8b5cf6', 'Home',            'expense', TRUE),
  (NULL, 'Lazer',         '#f59e0b', 'Gamepad2',        'expense', TRUE),
  (NULL, 'Saúde',         '#ec4899', 'Heart',           'expense', TRUE),
  (NULL, 'Educação',      '#06b6d4', 'BookOpen',        'expense', TRUE),
  (NULL, 'Vestuário',     '#f97316', 'Shirt',           'expense', TRUE),
  (NULL, 'Outros',        '#6b7280', 'Package',         'both',    TRUE),
  (NULL, 'Salário',       '#10b981', 'Briefcase',       'income',  TRUE),
  (NULL, 'Freelance',     '#14b8a6', 'Laptop',          'income',  TRUE),
  (NULL, 'Investimentos', '#6366f1', 'TrendingUp',      'income',  TRUE),
  (NULL, 'Presente',      '#f59e0b', 'Gift',            'income',  TRUE);

-- ── TRANSACTIONS ─────────────────────────────────────────────
CREATE TABLE transactions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id         UUID        NOT NULL REFERENCES categories(id),
  type                TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description         TEXT        NOT NULL DEFAULT '',
  notes               TEXT,
  date                DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_recurring        BOOLEAN     NOT NULL DEFAULT FALSE,
  recurring_interval  TEXT        CHECK (recurring_interval IN ('daily','weekly','monthly','yearly')),
  recurring_end_date  DATE,
  parent_id           UUID        REFERENCES transactions(id),
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date     ON transactions(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_type     ON transactions(user_id, type)      WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── GOALS ────────────────────────────────────────────────────
CREATE TABLE goals (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT          NOT NULL,
  target_amount   NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline        DATE,
  color           TEXT          NOT NULL DEFAULT '#10b981',
  icon            TEXT,
  status          TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_status ON goals(user_id, status);

CREATE TRIGGER set_updated_at_goals
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_select_own" ON goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "goals_insert_own" ON goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "goals_update_own" ON goals FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "goals_delete_own" ON goals FOR DELETE USING (user_id = auth.uid());

-- Trigger: completar meta automaticamente ao atingir 100%
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount THEN
    NEW.status        = 'completed';
    NEW.current_amount = NEW.target_amount;
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (NEW.user_id, 'goal', 'Meta concluída!',
            'Parabéns! Você atingiu sua meta "' || NEW.name || '".',
            jsonb_build_object('goal_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_goal_completion
  BEFORE UPDATE OF current_amount ON goals
  FOR EACH ROW EXECUTE FUNCTION check_goal_completion();

-- ── GOAL_CONTRIBUTIONS ───────────────────────────────────────
CREATE TABLE goal_contributions (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID          NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id    UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes      TEXT,
  date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_contributions_select_own" ON goal_contributions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "goal_contributions_insert_own" ON goal_contributions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "goal_contributions_delete_own" ON goal_contributions FOR DELETE USING (user_id = auth.uid());

-- ── BUDGETS ──────────────────────────────────────────────────
CREATE TABLE budgets (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id      UUID          NOT NULL REFERENCES categories(id),
  month            DATE          NOT NULL, -- sempre primeiro dia do mês
  planned_amount   NUMERIC(12,2) NOT NULL CHECK (planned_amount > 0),
  spent_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  alert_sent_80    BOOLEAN       NOT NULL DEFAULT FALSE,
  alert_sent_100   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);

CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select_own" ON budgets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "budgets_insert_own" ON budgets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "budgets_update_own" ON budgets FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "budgets_delete_own" ON budgets FOR DELETE USING (user_id = auth.uid());

-- Trigger: recalcular spent_amount ao inserir/atualizar/deletar transação
CREATE OR REPLACE FUNCTION recalculate_budget_spent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_month       DATE;
  v_category_id UUID;
  v_user_id     UUID;
  v_spent       NUMERIC(12,2);
  v_budget      RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_month := DATE_TRUNC('month', OLD.date);
    v_category_id := OLD.category_id;
    v_user_id     := OLD.user_id;
  ELSE
    v_month := DATE_TRUNC('month', NEW.date);
    v_category_id := NEW.category_id;
    v_user_id     := NEW.user_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_spent
  FROM transactions
  WHERE user_id = v_user_id
    AND category_id = v_category_id
    AND type = 'expense'
    AND DATE_TRUNC('month', date) = v_month
    AND deleted_at IS NULL;

  SELECT * INTO v_budget
  FROM budgets
  WHERE user_id = v_user_id AND category_id = v_category_id AND month = v_month;

  IF FOUND THEN
    UPDATE budgets SET spent_amount = v_spent
    WHERE id = v_budget.id;

    -- Alertas de orçamento
    IF v_spent >= v_budget.planned_amount AND NOT v_budget.alert_sent_100 THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (v_user_id, 'budget',
        'Orçamento estourado!',
        'O orçamento de "' || (SELECT name FROM categories WHERE id = v_category_id) || '" foi excedido.',
        jsonb_build_object('budget_id', v_budget.id, 'category_id', v_category_id));
      UPDATE budgets SET alert_sent_100 = TRUE WHERE id = v_budget.id;
    ELSIF v_spent >= v_budget.planned_amount * 0.8 AND NOT v_budget.alert_sent_80 THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (v_user_id, 'budget',
        'Orçamento em 80%',
        'Você já usou 80% do orçamento de "' || (SELECT name FROM categories WHERE id = v_category_id) || '".',
        jsonb_build_object('budget_id', v_budget.id, 'category_id', v_category_id));
      UPDATE budgets SET alert_sent_80 = TRUE WHERE id = v_budget.id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_recalculate_budget
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION recalculate_budget_spent();

-- ── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('budget','goal','transaction','salary','system')),
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  metadata   JSONB,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (user_id = auth.uid());

-- ── USER_SETTINGS ────────────────────────────────────────────
CREATE TABLE user_settings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  push_notifications  BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN     NOT NULL DEFAULT TRUE,
  transaction_alerts  BOOLEAN     NOT NULL DEFAULT TRUE,
  budget_alerts       BOOLEAN     NOT NULL DEFAULT TRUE,
  goal_alerts         BOOLEAN     NOT NULL DEFAULT TRUE,
  dark_mode           BOOLEAN     NOT NULL DEFAULT FALSE,
  language            TEXT        NOT NULL DEFAULT 'pt-BR',
  two_factor_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
  two_factor_secret   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Criar settings automaticamente ao criar perfil
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- ── AUDIT_LOGS ───────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  metadata    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT USING (user_id = auth.uid());
