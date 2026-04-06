-- ============================================================
--  FinControl - Reconcilia schema local com o estado real do Supabase
--  Migration: 20260406190000_reconcile_salary_schema
-- ============================================================

ALTER TABLE public.salary_configs
  ALTER COLUMN name SET DEFAULT 'Salário',
  ALTER COLUMN inss_amount SET DEFAULT 0,
  ALTER COLUMN irrf_amount SET DEFAULT 0;

UPDATE public.salary_configs
SET inss_amount = 0
WHERE inss_amount IS NULL;

UPDATE public.salary_configs
SET irrf_amount = 0
WHERE irrf_amount IS NULL;

ALTER TABLE public.salary_configs
  ALTER COLUMN inss_amount SET NOT NULL,
  ALTER COLUMN irrf_amount SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_salary_configs_one_active'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_salary_configs_one_active RENAME TO salary_configs_one_active';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_salary_configs_user
  ON public.salary_configs (user_id, active);

CREATE OR REPLACE FUNCTION public.get_salary_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id         uuid := auth.uid();
  v_config          salary_configs%ROWTYPE;
  v_today           date := CURRENT_DATE;
  v_prev_end        date;
  v_period_start    date;
  v_period_end      date;
  v_period_amount   numeric(12,2);
  v_total_spent     numeric(12,2);
  v_elapsed_days    int;
  v_elapsed_periods int;
  v_split1          numeric;
  v_split2          numeric;
BEGIN
  SELECT * INTO v_config
  FROM salary_configs
  WHERE user_id = v_user_id AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_split1 := v_config.payment_split_percent::numeric / 100.0;
  v_split2 := 1.0 - v_split1;

  IF v_config.payment_type = 'monthly' THEN
    v_period_amount := v_config.amount;
    IF EXTRACT(DAY FROM v_today)::int >= v_config.payment_day THEN
      v_period_start := make_date(
        EXTRACT(YEAR FROM v_today)::int,
        EXTRACT(MONTH FROM v_today)::int,
        v_config.payment_day
      );
    ELSE
      v_prev_end := date_trunc('month', v_today)::date - 1;
      v_period_start := make_date(
        EXTRACT(YEAR FROM v_prev_end)::int,
        EXTRACT(MONTH FROM v_prev_end)::int,
        LEAST(v_config.payment_day, EXTRACT(DAY FROM v_prev_end)::int)
      );
    END IF;
    v_period_end := (v_period_start + interval '1 month')::date - 1;

  ELSIF v_config.payment_type = 'biweekly' THEN
    IF EXTRACT(DAY FROM v_today)::int >= v_config.payment_day_2 THEN
      v_period_amount := ROUND(v_config.amount * v_split2, 2);
      v_period_start := make_date(
        EXTRACT(YEAR FROM v_today)::int,
        EXTRACT(MONTH FROM v_today)::int,
        v_config.payment_day_2
      );
      v_period_end := (date_trunc('month', v_today) + interval '1 month')::date - 1;
    ELSIF EXTRACT(DAY FROM v_today)::int >= v_config.payment_day THEN
      v_period_amount := ROUND(v_config.amount * v_split1, 2);
      v_period_start := make_date(
        EXTRACT(YEAR FROM v_today)::int,
        EXTRACT(MONTH FROM v_today)::int,
        v_config.payment_day
      );
      v_period_end := make_date(
        EXTRACT(YEAR FROM v_today)::int,
        EXTRACT(MONTH FROM v_today)::int,
        v_config.payment_day_2
      ) - 1;
    ELSE
      v_period_amount := ROUND(v_config.amount * v_split2, 2);
      v_prev_end := date_trunc('month', v_today)::date - 1;
      v_period_start := make_date(
        EXTRACT(YEAR FROM v_prev_end)::int,
        EXTRACT(MONTH FROM v_prev_end)::int,
        LEAST(v_config.payment_day_2, EXTRACT(DAY FROM v_prev_end)::int)
      );
      v_period_end := make_date(
        EXTRACT(YEAR FROM v_today)::int,
        EXTRACT(MONTH FROM v_today)::int,
        v_config.payment_day
      ) - 1;
    END IF;

  ELSIF v_config.payment_type = 'custom' THEN
    IF v_today < v_config.custom_start_date THEN
      RETURN NULL;
    END IF;

    v_period_amount := v_config.amount;
    v_elapsed_days := v_today - v_config.custom_start_date;
    v_elapsed_periods := v_elapsed_days / v_config.custom_interval_days;
    v_period_start := v_config.custom_start_date + (v_elapsed_periods * v_config.custom_interval_days);
    v_period_end := v_period_start + v_config.custom_interval_days - 1;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
  FROM transactions
  WHERE user_id = v_user_id
    AND type = 'expense'
    AND deleted_at IS NULL
    AND date::date BETWEEN v_period_start AND v_period_end;

  RETURN json_build_object(
    'config_id',              v_config.id,
    'name',                   v_config.name,
    'salary_amount',          v_period_amount,
    'gross_amount',           v_config.gross_amount,
    'inss_amount',            v_config.inss_amount,
    'irrf_amount',            v_config.irrf_amount,
    'other_deductions',       v_config.other_deductions,
    'other_deductions_label', v_config.other_deductions_label,
    'tax_mode',               v_config.tax_mode,
    'payment_type',           v_config.payment_type,
    'payment_split_percent',  v_config.payment_split_percent,
    'period_start',           v_period_start,
    'period_end',             v_period_end,
    'total_spent',            v_total_spent,
    'remaining',              v_period_amount - v_total_spent
  );
END;
$function$;
