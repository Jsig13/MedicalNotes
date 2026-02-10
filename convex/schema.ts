import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Provider profiles
  providers: defineTable({
    name: v.string(),
    email: v.string(),
    specialty: v.string(),
    credentials: v.string(), // e.g. "MD", "DO", "NP"
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Voice profiles for speaker identification
  voiceProfiles: defineTable({
    providerId: v.id("providers"),
    // Audio fingerprint data stored as a serialized array of voice characteristics
    voiceSampleIds: v.array(v.string()), // references to stored audio sample IDs
    enrollmentComplete: v.boolean(),
    sampleCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_provider", ["providerId"]),

  // Voice samples stored as binary data references
  voiceSamples: defineTable({
    profileId: v.id("voiceProfiles"),
    // We store audio as base64 for voice enrollment
    audioData: v.string(), // base64 encoded audio
    duration: v.number(), // duration in seconds
    createdAt: v.number(),
  }).index("by_profile", ["profileId"]),

  // Note templates (SOAP, H&P, Progress Note, etc.)
  templates: defineTable({
    name: v.string(),
    description: v.string(),
    providerId: v.optional(v.id("providers")), // null = system template
    category: v.string(), // "soap", "hp", "progress", "procedure", "custom"
    sections: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        placeholder: v.string(),
        required: v.boolean(),
        order: v.number(),
      })
    ),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider", ["providerId"])
    .index("by_category", ["category"]),

  // Patient encounters / visits
  encounters: defineTable({
    providerId: v.id("providers"),
    patientName: v.string(),
    patientId: v.optional(v.string()), // external patient identifier
    dateOfService: v.number(),
    chiefComplaint: v.optional(v.string()),
    status: v.string(), // "recording", "transcribing", "generating", "review", "complete"
    templateId: v.optional(v.id("templates")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider", ["providerId"])
    .index("by_status", ["status"])
    .index("by_date", ["dateOfService"]),

  // Transcript segments with speaker identification
  transcriptSegments: defineTable({
    encounterId: v.id("encounters"),
    speaker: v.string(), // "provider", "patient", "unknown"
    speakerName: v.optional(v.string()),
    text: v.string(),
    startTime: v.number(), // seconds from start
    endTime: v.number(),
    confidence: v.optional(v.number()),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_encounter", ["encounterId"])
    .index("by_encounter_order", ["encounterId", "order"]),

  // Generated notes
  notes: defineTable({
    encounterId: v.id("encounters"),
    templateId: v.id("templates"),
    providerId: v.id("providers"),
    // Each section of the note stored as key-value
    sections: v.array(
      v.object({
        sectionId: v.string(),
        title: v.string(),
        content: v.string(),
      })
    ),
    fullText: v.string(), // concatenated note text
    status: v.string(), // "draft", "reviewed", "signed", "amended"
    signedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_encounter", ["encounterId"])
    .index("by_provider", ["providerId"]),

  // Custom dictionary for medical terms
  customDictionary: defineTable({
    providerId: v.id("providers"),
    term: v.string(), // the correct spelling
    alternatives: v.array(v.string()), // common misheard/misspelled versions
    category: v.string(), // "medication", "diagnosis", "procedure", "anatomy", "custom"
    pronunciation: v.optional(v.string()), // phonetic guide
    createdAt: v.number(),
  })
    .index("by_provider", ["providerId"])
    .index("by_provider_category", ["providerId", "category"]),
});
