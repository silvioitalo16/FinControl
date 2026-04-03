-- ============================================================
--  FinControl — Salary Tax Columns + BR Tax Functions
--  Migration: 20260402000002_salary_tax_and_split
-- ============================================================

-- ── Novas colunas em salary_configs ──────────────────────────
ALTER TABLE salary_configs
  ADD COLUMN tax_mode             TEXT          NOT NULL DEFAULT 'net'
    CHECK (tax_mode IN ('net', 'gross_auto', 'gross_manual')),
  ADD COLUMN gross_amount         NUMERIC(12,2) CHECK (gross_amount > 0),
  ADD COLUMN inss_amount          NUMERIC(12,2) CHECK (inss_amount >= 0),
  ADD COLUMN irrf_amount          NUMERIC(12,2) CHECK (irrf_amount >= 0),
  ADD COLUMN other_deductions     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (other_deductions >= 0),
  ADD COLUMN other_deductions_label TEXT;

-- ── calculate_inss_br(gross) ─────────────────────────────────
-- Calcula INSS progressivo 2024 (teto: R$ 7.786,02).
CREATE OR REPLACE FUNCTION calculate_inss_br(gross NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_inss NUMERIC := 0;
  v_prev NUMERIC := 0;
BEGIN
  -- Faixa 1: até R$ 1.412,00 → 7,5%
  IF gross > v_prev THEN
    v_inss := v_inss + (LEAST(gross, 1412.00) - v_prev) * 0.075;
    v_prev := 1412.00;
  END IF;
  -- Faixa 2: até R$ 2.666,68 → 9%
  IF gross > v_prev THEN
    v_inss := v_inss + (LEAST(gross, 2666.68) - v_prev) * 0.09;
    v_prev := 2666.68;
  END IF;
  -- Faixa 3: até R$ 4.000,03 → 12%
  IF gross > v_prev THEN
    v_inss := v_inss + (LEAST(gross, 4000.03) - v_prev) * 0.12;
    v_prev := 4000.03;
  END IF;
  -- Faixa 4: até R$ 7.786,02 → 14%
  IF gross > v_prev THEN
    v_inss := v_inss + (LEAST(gross, 7786.02) - v_prev) * 0.14;
  END IF;

  RETURN ROUND(v_inss, 2);
END;
$$;

-- ── calculate_irrf_br(base) ──────────────────────────────────
-- Calcula IRRF progressivo 2024 sobre a base de cálculo (bruto - INSS).
CREATE OR REPLACE FUNCTION calculate_irrf_br(base NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF base <= 2259.20 THEN RETURN 0; END IF;
  IF base <= 2826.65 THEN RETURN GREATEST(0, ROUND(base * 0.075  - 169.44,  2)); END IF;
  IF base <= 3751.05 THEN RETURN GREATEST(0, ROUND(base * 0.15   - 381.44,  2)); END IF;
  IF base <= 4664.68 THEN RETURN GREATEST(0, ROUND(base * 0.225  - 662.77,  2)); END IF;
  RETURN GREATEST(0, ROUND(base * 0.275 - 896.00, 2));
END;
$$;

-- ── RPC: get_salary_status() — versão completa com impostos ──
CREATE OR REPLACE FUNCTION get_salary_status()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_config      salary_configs%ROWTYPE;
  v_received    NUMERIC(12,2);
  v_month_start DATE;
  v_percent     NUMERIC(5,1);
  v_inss        NUMERIC(12,2);
  v_irrf        NUMERIC(12,2);
  v_net         NUMERIC(12,2);
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
  WHERE t.user_id     = auth.uid()
    AND t.type        = 'income'
    AND LOWER(c.name) = 'salário'
    AND DATE_TRUNC('month', t.date) = v_month_start
    AND t.deleted_at IS NULL;

  v_percent := ROUND((v_received / NULLIF(v_config.amount, 0)) * 100, 1);

  -- Cálculo de impostos para o breakdown
  IF v_config.tax_mode = 'gross_auto' AND v_config.gross_amount IS NOT NULL THEN
    v_inss := calculate_inss_br(v_config.gross_amount);
    v_irrf := calculate_irrf_br(v_config.gross_amount - v_inss);
    v_net  := v_config.gross_amount - v_inss - v_irrf - COALESCE(v_config.other_deductions, 0);
  ELSIF v_config.tax_mode = 'gross_manual' AND v_config.gross_amount IS NOT NULL THEN
    v_inss := COALESCE(v_config.inss_amount, 0);
    v_irrf := COALESCE(v_config.irrf_amount, 0);
    v_net  := v_config.gross_amount - v_inss - v_irrf - COALESCE(v_config.other_deductions, 0);
  ELSE
    -- tax_mode = 'net'
    v_inss := NULL;
    v_irrf := NULL;
    v_net  := v_config.amount;
  END IF;

  RETURN jsonb_build_object(
    'config_id',              v_config.id,
    'name',                   v_config.name,
    'tax_mode',               v_config.tax_mode,
    'amount',                 v_config.amount,
    'gross_amount',           v_config.gross_amount,
    'inss_amount',            v_inss,
    'irrf_amount',            v_irrf,
    'other_deductions',       v_config.other_deductions,
    'other_deductions_label', v_config.other_deductions_label,
    'net_amount',             v_net,
    'payment_type',           v_config.payment_type,
    'payment_day',            v_config.payment_day,
    'payment_day_2',          v_config.payment_day_2,
    'payment_split_percent',  v_config.payment_split_percent,
    'received',               v_received,
    'remaining',              GREATEST(0, v_config.amount - v_received),
    'percent',                COALESCE(v_percent, 0)
  );
END;
$$;
