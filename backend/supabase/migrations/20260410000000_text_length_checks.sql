-- ============================================================
--  FinControl — Length checks em colunas TEXT sensíveis
--  Migration: 20260410000000_text_length_checks
--
--  Motivo: defesa contra clientes adulterados que escrevem
--  direto no Supabase via PostgREST sem passar pelo backend.
--  Impede bloat de banco e DoS lógico com payloads gigantes.
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
ALTER TABLE profiles
  ADD CONSTRAINT profiles_full_name_len  CHECK (length(full_name)  <= 100),
  ADD CONSTRAINT profiles_avatar_url_len CHECK (avatar_url IS NULL OR length(avatar_url) <= 500),
  ADD CONSTRAINT profiles_phone_len      CHECK (phone      IS NULL OR length(phone)      <= 30),
  ADD CONSTRAINT profiles_location_len   CHECK (location   IS NULL OR length(location)   <= 100);

-- ── CATEGORIES ───────────────────────────────────────────────
ALTER TABLE categories
  ADD CONSTRAINT categories_name_len  CHECK (length(name)  <= 50),
  ADD CONSTRAINT categories_icon_len  CHECK (length(icon)  <= 50),
  ADD CONSTRAINT categories_color_len CHECK (length(color) <= 20);

-- ── TRANSACTIONS ─────────────────────────────────────────────
ALTER TABLE transactions
  ADD CONSTRAINT transactions_description_len CHECK (length(description) <= 255),
  ADD CONSTRAINT transactions_notes_len       CHECK (notes IS NULL OR length(notes) <= 1000);

-- ── GOALS ────────────────────────────────────────────────────
ALTER TABLE goals
  ADD CONSTRAINT goals_name_len  CHECK (length(name) <= 100),
  ADD CONSTRAINT goals_color_len CHECK (length(color) <= 20),
  ADD CONSTRAINT goals_icon_len  CHECK (icon IS NULL OR length(icon) <= 50);

-- ── GOAL_CONTRIBUTIONS ───────────────────────────────────────
ALTER TABLE goal_contributions
  ADD CONSTRAINT goal_contributions_notes_len CHECK (notes IS NULL OR length(notes) <= 500);

-- ── NOTIFICATIONS ────────────────────────────────────────────
ALTER TABLE notifications
  ADD CONSTRAINT notifications_title_len   CHECK (length(title)   <= 200),
  ADD CONSTRAINT notifications_message_len CHECK (length(message) <= 1000);
