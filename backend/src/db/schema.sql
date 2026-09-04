-- Event Impact Reporting System - PostgreSQL schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17 UN Sustainable Development Goals (reference table)
CREATE TABLE IF NOT EXISTS sdg_goals (
  id          SMALLINT PRIMARY KEY,       -- 1-17
  name        VARCHAR(120) NOT NULL,
  color_hex   VARCHAR(7) NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  event_date   DATE NOT NULL,
  location     VARCHAR(255),
  organizer    VARCHAR(255),
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);

-- Many-to-many: an event can map to several SDGs
CREATE TABLE IF NOT EXISTS event_sdg_map (
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sdg_id      SMALLINT NOT NULL REFERENCES sdg_goals(id),
  PRIMARY KEY (event_id, sdg_id)
);

-- Attendance sheet upload rows (one row per attendee)
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name     VARCHAR(255),
  gender        VARCHAR(20),   -- 'male' | 'female' | 'other' | 'prefer_not_to_say'
  age_group     VARCHAR(20),   -- e.g. 'under_18','18_24','25_34','35_44','45_54','55_plus'
  registered    BOOLEAN NOT NULL DEFAULT true,
  attended      BOOLEAN NOT NULL DEFAULT false,
  raw_row       JSONB,          -- original row data, for traceability
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Survey response upload rows (one row per respondent)
CREATE TABLE IF NOT EXISTS survey_responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  satisfaction_score NUMERIC(4,2),  -- normalized 0-10 if present in sheet
  feedback_text     TEXT,
  raw_row           JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upload log, tracks each file processed
CREATE TABLE IF NOT EXISTS uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  upload_type   VARCHAR(20) NOT NULL, -- 'attendance' | 'survey'
  filename      VARCHAR(255) NOT NULL,
  row_count     INTEGER DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'processed', -- 'processed' | 'failed'
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Photo gallery
CREATE TABLE IF NOT EXISTS photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_path   VARCHAR(500) NOT NULL,
  caption     VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated PDF reports
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_path       VARCHAR(500) NOT NULL,
  ai_summary      TEXT,
  ai_recommendations TEXT,
  ai_sections     JSONB,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_survey_event ON survey_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_event ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_event ON reports(event_id);

-- Seed the 17 SDGs
INSERT INTO sdg_goals (id, name, color_hex) VALUES
 (1,  'No Poverty', '#E5243B'),
 (2,  'Zero Hunger', '#DDA63A'),
 (3,  'Good Health and Well-being', '#4C9F38'),
 (4,  'Quality Education', '#C5192D'),
 (5,  'Gender Equality', '#FF3A21'),
 (6,  'Clean Water and Sanitation', '#26BDE2'),
 (7,  'Affordable and Clean Energy', '#FCC30B'),
 (8,  'Decent Work and Economic Growth', '#A21942'),
 (9,  'Industry, Innovation and Infrastructure', '#FD6925'),
 (10, 'Reduced Inequalities', '#DD1367'),
 (11, 'Sustainable Cities and Communities', '#FD9D24'),
 (12, 'Responsible Consumption and Production', '#BF8B2E'),
 (13, 'Climate Action', '#3F7E44'),
 (14, 'Life Below Water', '#0A97D9'),
 (15, 'Life on Land', '#56C02B'),
 (16, 'Peace, Justice and Strong Institutions', '#00689D'),
 (17, 'Partnerships for the Goals', '#19486A')
ON CONFLICT (id) DO NOTHING;

-- Safe upgrades for databases created before auth/report-sections were added
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_sections JSONB;
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
