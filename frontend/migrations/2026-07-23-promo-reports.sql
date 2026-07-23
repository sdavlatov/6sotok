-- ============================================================================
-- Миграция Neon: продвижение объявлений + модерация (жалобы) + аватар.
-- Выполнить в Neon SQL Editor ДО деплоя кода, использующего эти поля.
-- Все операции идемпотентны — повторный запуск безопасен.
-- ============================================================================

-- 1) Поля продвижения на объявлениях -----------------------------------------
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_urgent   boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS old_price   numeric;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS promo_until timestamp with time zone;

-- 2) Статус «снято модерацией» -----------------------------------------------
ALTER TYPE enum_listings_status ADD VALUE IF NOT EXISTS 'blocked';

-- 3) Аватар пользователя (на случай, если колонки нет в проде) ----------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_id integer;
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_avatar_id_media_id_fk
    FOREIGN KEY (avatar_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Enum-типы для жалоб ------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE enum_reports_reason AS ENUM ('fraud','stale','wrong_info','duplicate','spam','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE enum_reports_status AS ENUM ('new','reviewed','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) Таблица жалоб ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id               serial PRIMARY KEY,
  listing_id       integer NOT NULL REFERENCES listings(id) ON DELETE SET NULL,
  reason           enum_reports_reason NOT NULL,
  comment          varchar,
  status           enum_reports_status NOT NULL DEFAULT 'new',
  reporter_contact varchar,
  updated_at       timestamp with time zone NOT NULL DEFAULT now(),
  created_at       timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_listing_idx    ON reports (listing_id);
CREATE INDEX IF NOT EXISTS reports_updated_at_idx ON reports (updated_at);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at);
