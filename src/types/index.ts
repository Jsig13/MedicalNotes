export interface Provider {
  id: string;
  name: string;
  email: string;
  specialty: string;
  credentials: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateSection {
  id: string;
  group: string;       // "Subjective" | "Objective" | "Assessment & Plan" | "Orders" | "Narrative"
  title: string;
  format: string;      // "paragraph" | "bullet" | "custom-ros" | "bluf-ap" | "orders"
  order: number;
  instructions: string; // Freed-style AI instructions
}

export interface Template {
  id: string;
  provider_id: string | null;
  name: string;
  description: string;
  category: string;    // "soap" | "hp" | "progress" | "custom" | "doxgpt"
  is_default: boolean;
  sections: TemplateSection[];
  created_at: string;
  updated_at: string;
}

export interface Encounter {
  id: string;
  provider_id: string;
  template_id: string | null;
  patient_name: string;
  patient_id: string | null;
  chief_complaint: string | null;
  date_of_service: string;
  status: "recording" | "scrubbing" | "generating" | "review" | "complete";
  created_at: string;
  updated_at: string;
  template?: Template;
}

export interface TranscriptSegment {
  id: string;
  encounter_id: string;
  speaker: "provider" | "patient" | "unknown";
  speaker_name: string | null;
  text: string;
  start_time: number;
  end_time: number;
  confidence: number | null;
  segment_order: number;
  created_at: string;
}

export interface DictionaryEntry {
  id: string;
  provider_id: string;
  wrong_text: string;
  correct_text: string;
  category: "medical" | "military" | "names" | "custom";
  enabled: boolean;
  created_at: string;
}

export interface ScrubCorrection {
  id: string;
  encounter_id: string;
  dictionary_id: string | null;
  original_text: string;
  corrected_text: string;
  context: string | null;
  accepted: boolean;
  created_at: string;
}

export interface PersonalContentFlag {
  id: string;
  encounter_id: string;
  text_content: string;
  flagged: boolean;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  icd10: string;
  bluf: string;
  narrative: string;
  prev_completed: string[];
  ordered_planned: string[];
}

export interface NoteSection {
  section_id: string;
  title: string;
  content: string;
}

export interface Note {
  id: string;
  encounter_id: string;
  template_id: string | null;
  provider_id: string;
  sections: NoteSection[];
  diagnoses: Diagnosis[];
  full_text: string;
  status: "draft" | "reviewed" | "signed" | "amended";
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EncounterTodo {
  id: string;
  encounter_id: string;
  text: string;
  category: "imaging" | "referral" | "rx" | "lab" | "followup" | "general";
  done: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ProviderTodo {
  id: string;
  provider_id: string;
  encounter_id: string | null;
  text: string;
  encounter_label: string | null;
  done: boolean;
  completed_at: string | null;
  created_at: string;
}

// Web Speech API types
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
