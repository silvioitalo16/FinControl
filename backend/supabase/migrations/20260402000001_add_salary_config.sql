-- ============================================================
--  FinControl — Salary Config
--  Migration: 20260402000001_add_salary_config
-- ============================================================

-- ── SALARY_CONFIGS ───────────────────────────────────────────
CREATE TABLE salary_configs (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                  TEXT          NOT NULL DEFAULT 'Meu Salário',
  active                BOOLEAN       NOT NULL DEFAULT TRUE,
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type          TEXT          NOT NULL CHECK (payment_type IN ('monthly', 'biweekly', 'custom')),
  payment_day           INTEGER       CHECK (payment_day BETWEEN 1 AND 31),
  payment_day_2         INTEGER       CHECK (payment_day_2 BETWEEN 1 AND 31),
  payment_split_percent INTEGER       NOT NULL DEFAULT 50 CHECK (payment_split_percent BETWEEN 1 AND 99),
  custom_interval_days  INTEGER       CHECK (custom_interval_days >= 1),
  custom_start_date     DATE,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Apenas uma config ativa por usuário
CREATE UNIQUE INDEX idx_salary_configs_one_active
  ON salary_configs(user_id)
  WHERE active = TRUE;

CREATE TRIGGER set_updated_at_salary_configs
  BEFORE UPDATE ON salary_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE salary_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary_configs_select_own" ON salary_configs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "salary_configs_insert_own" ON salary_configs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "salary_configs_update_own" ON salary_configs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "salary_configs_delete_own" ON salary_configs FOR DELETE USING (user_id = auth.uid());

-- ── RPC: get_salary_status() ─────────────────────────────────
-- Retorna status do salário do mês atual para o usuário logado.
CREATE OR REPLACE FUNCTION get_salary_status()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_config      salary_configs%ROWTYPE;
  v_received    NUMERIC(12,2);
  v_month_start DATE;
  v_percent     NUMERIC(5,1);
BEGIN
  SELECT * INTO v_config
  FROM salary_configs
  WHERE user_id = auth.uid() AND active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_month_start := DATE_TRUNC('month', CURRENT_DATE);

  SELECT COALESCE(SUM(t.amount), 0) INTO v_received
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.user_id    = auth.uid()
    AND t.type       = 'income'
    AND LOWER(c.name) = 'salário'
    AND DATE_TRUNC('month', t.date) = v_month_start
    AND t.deleted_at IS NULL;

  v_percent := ROUND((v_received / NULLIF(v_config.amount, 0)) * 100, 1);

  RETURN jsonb_build_object(
    'config_id',    v_config.id,
    'name',         v_config.name,
    'amount',       v_config.amount,
    'payment_type', v_config.payment_type,
    'payment_day',  v_config.payment_day,
    'payment_day_2', v_config.payment_day_2,
    'payment_split_percent', v_config.payment_split_percent,
    'received',     v_received,
    'remaining',    GREATEST(0, v_config.amount - v_received),
    'percent',      COALESCE(v_percent, 0)
  );
END;
$$;

-- ── TRIGGER: notify_salary_consumed ──────────────────────────
-- Envia notificação quando 50% e 100% do salário forem recebidos.
CREATE OR REPLACE FUNCTION notify_salary_consumed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_config   salary_configs%ROWTYPE;
  v_received NUMERIC(12,2);
  v_percent  NUMERIC(5,1);
  v_cat_name TEXT;
BEGIN
  IF NEW.type != 'income' OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_config
  FROM salary_configs
  WHERE user_id = NEW.user_id AND active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT LOWER(name) INTO v_cat_name FROM categories WHERE id = NEW.category_id;
  IF v_cat_name != 'salário' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(t.amount), 0) INTO v_received
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.user_id    = NEW.user_id
    AND t.type       = 'income'
    AND LOWER(c.name) = 'salário'
    AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', NEW.date)
    AND t.deleted_at IS NULL;

  v_percent := ROUND((v_received / NULLIF(v_config.amount, 0)) * 100, 1);

  IF v_percent >= 100 THEN
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id  = NEW.user_id
        AND type     = 'salary'
        AND title    = 'Salário recebido!'
        AND created_at >= DATE_TRUNC('month', NOW())
    ) THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (NEW.user_id, 'salary',
        'Salário recebido!',
        'Você já recebeu 100% do seu salário este mês.',
        jsonb_build_object('config_id', v_config.id, 'received', v_received, 'percent', v_percent));
    END IF;

  ELSIF v_percent >= 50 THEN
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id  = NEW.user_id
        AND type     = 'salary'
        AND title    = '50% do salário recebido'
        AND created_at >= DATE_TRUNC('month', NOW())
    ) THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (NEW.user_id, 'salary',
        '50% do salário recebido',
        'Você já recebeu metade do seu salário este mês.',
        jsonb_build_object('config_id', v_config.id, 'received', v_received, 'percent', v_percent));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_salary_consumed
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION notify_salary_consumed();
