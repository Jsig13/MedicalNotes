-- MedScribe Database Schema
-- Supabase migration for medical notes application

-- ============================================
-- PROVIDERS (clinician profiles)
-- ============================================
CREATE TABLE providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  specialty TEXT NOT NULL DEFAULT 'General Practice',
  credentials TEXT NOT NULL DEFAULT 'MD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTE TEMPLATES (Freed-style structured templates)
-- ============================================
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- sections format: [{
  --   "id": "hpi",
  --   "group": "Subjective",
  --   "title": "History of Present Illness",
  --   "format": "paragraph",  -- paragraph | bullet | custom-ros | bluf-ap | orders
  --   "order": 0,
  --   "instructions": "(custom AI instructions here)",
  --   "expanded": false
  -- }]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_provider ON templates(provider_id);
CREATE INDEX idx_templates_category ON templates(category);

-- ============================================
-- ENCOUNTERS (patient visits)
-- ============================================
CREATE TABLE encounters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_id TEXT,  -- external MRN
  chief_complaint TEXT,
  date_of_service TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'recording'
    CHECK (status IN ('recording','scrubbing','generating','review','complete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_encounters_provider ON encounters(provider_id);
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_encounters_date ON encounters(date_of_service DESC);

-- ============================================
-- TRANSCRIPT SEGMENTS (split by speaker)
-- ============================================
CREATE TABLE transcript_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('provider','patient','unknown')),
  speaker_name TEXT,
  text TEXT NOT NULL,
  start_time REAL NOT NULL DEFAULT 0,  -- seconds from recording start
  end_time REAL NOT NULL DEFAULT 0,
  confidence REAL,
  segment_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_segments_encounter ON transcript_segments(encounter_id);
CREATE INDEX idx_segments_order ON transcript_segments(encounter_id, segment_order);

-- ============================================
-- CUSTOM DICTIONARY (for transcript scrubbing)
-- ============================================
CREATE TABLE dictionary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  wrong_text TEXT NOT NULL,    -- misspelled/misheard version
  correct_text TEXT NOT NULL,  -- correct spelling
  category TEXT NOT NULL DEFAULT 'medical'
    CHECK (category IN ('medical','military','names','custom')),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dictionary_provider ON dictionary(provider_id);
CREATE INDEX idx_dictionary_category ON dictionary(provider_id, category);

-- ============================================
-- SCRUB RESULTS (corrections applied per encounter)
-- ============================================
CREATE TABLE scrub_corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  dictionary_id UUID REFERENCES dictionary(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  context TEXT,  -- surrounding sentence for review
  accepted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scrub_encounter ON scrub_corrections(encounter_id);

-- Personal content flags (non-clinical content detected)
CREATE TABLE personal_content_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT true,  -- true = will be removed
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_personal_flags_encounter ON personal_content_flags(encounter_id);

-- ============================================
-- GENERATED NOTES
-- ============================================
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- sections format: [{
  --   "section_id": "hpi",
  --   "title": "History of Present Illness",
  --   "content": "..."
  -- }]
  diagnoses JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- diagnoses format: [{
  --   "id": "dx1",
  --   "name": "TBI",
  --   "icd10": "S06.0X0S",
  --   "bluf": "...",
  --   "narrative": "...",
  --   "prev_completed": ["..."],
  --   "ordered_planned": ["..."]
  -- }]
  full_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','reviewed','signed','amended')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_encounter ON notes(encounter_id);
CREATE INDEX idx_notes_provider ON notes(provider_id);

-- ============================================
-- ENCOUNTER TO-DOS (per-patient orders/tasks)
-- ============================================
CREATE TABLE encounter_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('imaging','referral','rx','lab','followup','general')),
  done BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enc_todos_encounter ON encounter_todos(encounter_id);
CREATE INDEX idx_enc_todos_done ON encounter_todos(done) WHERE done = false;

-- ============================================
-- PROVIDER TO-DOS (persistent across encounters)
-- ============================================
CREATE TABLE provider_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  encounter_label TEXT,  -- display name like "SGT Rodriguez"
  done BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prov_todos_provider ON provider_todos(provider_id);
CREATE INDEX idx_prov_todos_done ON provider_todos(done) WHERE done = false;

-- ============================================
-- VOICE PROFILES (for speaker identification)
-- ============================================
CREATE TABLE voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  enrollment_complete BOOLEAN DEFAULT false,
  sample_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_provider ON voice_profiles(provider_id);

CREATE TABLE voice_samples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES voice_profiles(id) ON DELETE CASCADE,
  audio_data TEXT NOT NULL,  -- base64 encoded
  duration REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_samples_profile ON voice_samples(profile_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER encounters_updated_at BEFORE UPDATE ON encounters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER voice_profiles_updated_at BEFORE UPDATE ON voice_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrub_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounter_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_samples ENABLE ROW LEVEL SECURITY;

-- For now, allow all access for authenticated users
-- TODO: Tighten these to provider-specific access
CREATE POLICY "Allow all for authenticated" ON providers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON templates FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON encounters FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON transcript_segments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON dictionary FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON scrub_corrections FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON personal_content_flags FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON encounter_todos FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON provider_todos FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON voice_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON voice_samples FOR ALL USING (true);
