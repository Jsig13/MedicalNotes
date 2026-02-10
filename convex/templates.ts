import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const sectionValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  placeholder: v.string(),
  required: v.boolean(),
  order: v.number(),
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    providerId: v.optional(v.id("providers")),
    category: v.string(),
    sections: v.array(sectionValidator),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("templates", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("templates").collect();
  },
});

export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("templates")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sections: v.optional(v.array(sectionValidator)),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Seed default templates
export const seedDefaults = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("templates").collect();
    if (existing.length > 0) return;

    // SOAP Note Template
    await ctx.db.insert("templates", {
      name: "SOAP Note",
      description: "Standard Subjective, Objective, Assessment, Plan format",
      category: "soap",
      sections: [
        {
          id: "subjective",
          title: "Subjective",
          description: "Patient's reported symptoms, history, and concerns",
          placeholder: "Chief complaint, HPI, ROS, PMH, medications, allergies, social/family history",
          required: true,
          order: 0,
        },
        {
          id: "objective",
          title: "Objective",
          description: "Clinical findings, vitals, exam, and test results",
          placeholder: "Vital signs, physical exam findings, lab results, imaging",
          required: true,
          order: 1,
        },
        {
          id: "assessment",
          title: "Assessment",
          description: "Diagnosis and clinical reasoning",
          placeholder: "Primary and differential diagnoses with clinical reasoning",
          required: true,
          order: 2,
        },
        {
          id: "plan",
          title: "Plan",
          description: "Treatment plan, follow-up, and patient education",
          placeholder: "Medications, procedures, referrals, follow-up, patient instructions",
          required: true,
          order: 3,
        },
      ],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // H&P Template
    await ctx.db.insert("templates", {
      name: "History & Physical",
      description: "Comprehensive history and physical examination",
      category: "hp",
      sections: [
        {
          id: "cc",
          title: "Chief Complaint",
          description: "Primary reason for the visit",
          placeholder: "Patient's main complaint in their own words",
          required: true,
          order: 0,
        },
        {
          id: "hpi",
          title: "History of Present Illness",
          description: "Detailed history of the current condition",
          placeholder: "Onset, location, duration, character, aggravating/relieving factors, timing, severity",
          required: true,
          order: 1,
        },
        {
          id: "pmh",
          title: "Past Medical History",
          description: "Previous medical conditions and surgeries",
          placeholder: "Past diagnoses, hospitalizations, surgeries",
          required: true,
          order: 2,
        },
        {
          id: "medications",
          title: "Medications",
          description: "Current medications and dosages",
          placeholder: "Medication name, dose, frequency, route",
          required: true,
          order: 3,
        },
        {
          id: "allergies",
          title: "Allergies",
          description: "Known allergies and reactions",
          placeholder: "Drug allergies, food allergies, environmental allergies with reactions",
          required: true,
          order: 4,
        },
        {
          id: "social",
          title: "Social History",
          description: "Social factors affecting health",
          placeholder: "Tobacco, alcohol, drug use, occupation, living situation",
          required: false,
          order: 5,
        },
        {
          id: "family",
          title: "Family History",
          description: "Relevant family medical history",
          placeholder: "Family history of relevant conditions",
          required: false,
          order: 6,
        },
        {
          id: "ros",
          title: "Review of Systems",
          description: "Systematic review by organ system",
          placeholder: "Constitutional, HEENT, cardiovascular, respiratory, GI, GU, MSK, neuro, psych, skin",
          required: true,
          order: 7,
        },
        {
          id: "pe",
          title: "Physical Examination",
          description: "Findings from physical examination",
          placeholder: "Vital signs, general appearance, exam by system",
          required: true,
          order: 8,
        },
        {
          id: "assessment_plan",
          title: "Assessment & Plan",
          description: "Diagnosis and treatment plan",
          placeholder: "Diagnoses with treatment plans for each",
          required: true,
          order: 9,
        },
      ],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Progress Note Template
    await ctx.db.insert("templates", {
      name: "Progress Note",
      description: "Follow-up visit documentation",
      category: "progress",
      sections: [
        {
          id: "interval_history",
          title: "Interval History",
          description: "Changes since last visit",
          placeholder: "Symptoms since last visit, response to treatment, new concerns",
          required: true,
          order: 0,
        },
        {
          id: "current_medications",
          title: "Current Medications",
          description: "Active medication list",
          placeholder: "Current medications with any changes",
          required: true,
          order: 1,
        },
        {
          id: "examination",
          title: "Examination",
          description: "Focused physical exam",
          placeholder: "Relevant physical exam findings",
          required: true,
          order: 2,
        },
        {
          id: "results",
          title: "Results Review",
          description: "Lab and imaging results",
          placeholder: "Recent lab results, imaging, and other test results",
          required: false,
          order: 3,
        },
        {
          id: "assessment",
          title: "Assessment",
          description: "Current status of conditions",
          placeholder: "Status of each problem being addressed",
          required: true,
          order: 4,
        },
        {
          id: "plan",
          title: "Plan",
          description: "Updated treatment plan",
          placeholder: "Medication changes, new orders, referrals, follow-up timeline",
          required: true,
          order: 5,
        },
      ],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Procedure Note Template
    await ctx.db.insert("templates", {
      name: "Procedure Note",
      description: "Documentation for procedures performed",
      category: "procedure",
      sections: [
        {
          id: "indication",
          title: "Indication",
          description: "Reason for the procedure",
          placeholder: "Clinical indication and justification",
          required: true,
          order: 0,
        },
        {
          id: "consent",
          title: "Consent",
          description: "Consent documentation",
          placeholder: "Informed consent obtained, risks discussed",
          required: true,
          order: 1,
        },
        {
          id: "procedure_details",
          title: "Procedure Details",
          description: "Step-by-step procedure description",
          placeholder: "Technique, findings, specimens obtained",
          required: true,
          order: 2,
        },
        {
          id: "complications",
          title: "Complications",
          description: "Any complications encountered",
          placeholder: "None, or description of complications",
          required: true,
          order: 3,
        },
        {
          id: "post_procedure",
          title: "Post-Procedure Plan",
          description: "Post-procedure care and follow-up",
          placeholder: "Recovery instructions, medications, follow-up plan",
          required: true,
          order: 4,
        },
      ],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
