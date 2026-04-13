-- =====================================================
-- Migration: AI Content Translation System
-- Date: 2026-02-22
-- Description: 번역 4개 테이블 생성 + 기존 테이블 컬럼 추가
-- 🚨 스테이징 긴급: tdo_original_lang, ntc_original_lang 미존재 에러 해소
-- =====================================================

-- =====================================================
-- 1. amb_content_translations: 콘텐츠 번역 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_content_translations (
  trn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID,
  trn_source_type VARCHAR(30) NOT NULL,
  trn_source_id UUID NOT NULL,
  trn_source_field VARCHAR(50) NOT NULL,
  trn_source_lang VARCHAR(5) NOT NULL,
  trn_target_lang VARCHAR(5) NOT NULL,
  trn_content TEXT NOT NULL,
  trn_source_hash VARCHAR(64),
  trn_method VARCHAR(20) DEFAULT 'AI',
  trn_confidence DECIMAL(3,2),
  trn_is_stale BOOLEAN DEFAULT false,
  trn_is_locked BOOLEAN DEFAULT false,
  trn_locked_by UUID,
  trn_locked_at TIMESTAMP,
  trn_translated_by UUID NOT NULL,
  trn_last_edited_by UUID,
  trn_last_edited_at TIMESTAMP,
  trn_version INTEGER DEFAULT 1,
  trn_is_deleted BOOLEAN DEFAULT false,
  trn_deleted_at TIMESTAMP,
  trn_created_at TIMESTAMP DEFAULT NOW(),
  trn_updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint
ALTER TABLE amb_content_translations
  DROP CONSTRAINT IF EXISTS "UQ_translation_source_target";
ALTER TABLE amb_content_translations
  ADD CONSTRAINT "UQ_translation_source_target"
  UNIQUE (trn_source_type, trn_source_id, trn_source_field, trn_target_lang);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trn_source ON amb_content_translations(trn_source_type, trn_source_id);
CREATE INDEX IF NOT EXISTS idx_trn_target_lang ON amb_content_translations(trn_target_lang);
CREATE INDEX IF NOT EXISTS idx_trn_is_stale ON amb_content_translations(trn_is_stale);
CREATE INDEX IF NOT EXISTS idx_trn_ent_id ON amb_content_translations(ent_id);

-- =====================================================
-- 2. amb_translation_glossary: 번역 용어집 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_translation_glossary (
  gls_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID,
  gls_term_en VARCHAR(200) NOT NULL,
  gls_term_ko VARCHAR(200),
  gls_term_vi VARCHAR(200),
  gls_category VARCHAR(50),
  gls_context TEXT,
  gls_is_deleted BOOLEAN DEFAULT false,
  gls_created_by UUID NOT NULL,
  gls_created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gls_ent_id ON amb_translation_glossary(ent_id);
CREATE INDEX IF NOT EXISTS idx_gls_term_en ON amb_translation_glossary(gls_term_en);
CREATE INDEX IF NOT EXISTS idx_gls_category ON amb_translation_glossary(gls_category);

-- =====================================================
-- 3. amb_content_translation_history: 번역 이력 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_content_translation_history (
  thi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trn_id UUID NOT NULL REFERENCES amb_content_translations(trn_id),
  thi_content TEXT NOT NULL,
  thi_method VARCHAR(20) NOT NULL,
  thi_version INTEGER NOT NULL,
  thi_edited_by UUID NOT NULL,
  thi_change_reason VARCHAR(200),
  thi_created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thi_trn_id ON amb_content_translation_history(trn_id);

-- =====================================================
-- 4. amb_translation_usage: 번역 사용량 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_translation_usage (
  tus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID,
  usr_id UUID NOT NULL,
  tus_source_type VARCHAR(30) NOT NULL,
  tus_source_lang VARCHAR(5) NOT NULL,
  tus_target_lang VARCHAR(5) NOT NULL,
  tus_input_tokens INTEGER DEFAULT 0,
  tus_output_tokens INTEGER DEFAULT 0,
  tus_cost_usd DECIMAL(10,6) DEFAULT 0,
  tus_created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tus_usr_id ON amb_translation_usage(usr_id);
CREATE INDEX IF NOT EXISTS idx_tus_ent_id ON amb_translation_usage(ent_id);
CREATE INDEX IF NOT EXISTS idx_tus_created_at ON amb_translation_usage(tus_created_at);

-- =====================================================
-- 5. 기존 테이블 컬럼 추가 (🚨 스테이징 에러 해소)
-- =====================================================

-- amb_todos: 원문 언어
ALTER TABLE amb_todos
  ADD COLUMN IF NOT EXISTS tdo_original_lang VARCHAR(5) DEFAULT 'ko';

-- amb_notices: 원문 언어
ALTER TABLE amb_notices
  ADD COLUMN IF NOT EXISTS ntc_original_lang VARCHAR(5) DEFAULT 'ko';

-- amb_meeting_notes: 원문 언어
ALTER TABLE amb_meeting_notes
  ADD COLUMN IF NOT EXISTS mtn_original_lang VARCHAR(5) DEFAULT 'ko';

-- amb_users: 번역 설정 (JSONB)
ALTER TABLE amb_users
  ADD COLUMN IF NOT EXISTS usr_translation_prefs JSONB DEFAULT '{"save_prompt":"ASK","preferred_view_lang":"original"}';
