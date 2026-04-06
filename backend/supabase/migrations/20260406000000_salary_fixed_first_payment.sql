-- FinControl — adiciona suporte a valor fixo no 1º pagamento quinzenal
-- Migration: 20260406000000_salary_fixed_first_payment

ALTER TABLE salary_configs
  ADD COLUMN payment_fixed_first_amount NUMERIC(12,2) DEFAULT NULL;

COMMENT ON COLUMN salary_configs.payment_fixed_first_amount IS
  'Valor fixo do 1º pagamento (adiantamento). Quando preenchido, ignora payment_split_percent para o display.';
