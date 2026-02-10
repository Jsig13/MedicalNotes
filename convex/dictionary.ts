import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    providerId: v.id("providers"),
    term: v.string(),
    alternatives: v.array(v.string()),
    category: v.string(),
    pronunciation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customDictionary", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customDictionary")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
  },
});

export const listByCategory = query({
  args: {
    providerId: v.id("providers"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customDictionary")
      .withIndex("by_provider_category", (q) =>
        q.eq("providerId", args.providerId).eq("category", args.category)
      )
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("customDictionary"),
    term: v.optional(v.string()),
    alternatives: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    pronunciation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("customDictionary") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const seedCommonMedicalTerms = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customDictionary")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .first();

    if (existing) return; // Already seeded

    const commonTerms = [
      { term: "acetaminophen", alternatives: ["aseta minifin", "a seta minifin", "tylenol"], category: "medication" },
      { term: "amoxicillin", alternatives: ["amox a cillin", "a moxicillin"], category: "medication" },
      { term: "metformin", alternatives: ["met formin", "metforman"], category: "medication" },
      { term: "lisinopril", alternatives: ["liz in o pril", "lisinipril"], category: "medication" },
      { term: "atorvastatin", alternatives: ["a tor va statin", "lipitor"], category: "medication" },
      { term: "omeprazole", alternatives: ["oh mep ra zole", "prilosec"], category: "medication" },
      { term: "hypertension", alternatives: ["hyper tension", "high blood pressure"], category: "diagnosis" },
      { term: "diabetes mellitus", alternatives: ["diabetes malitis", "diabetes melitis"], category: "diagnosis" },
      { term: "hyperlipidemia", alternatives: ["hyper lipid emia", "high cholesterol"], category: "diagnosis" },
      { term: "gastroesophageal reflux", alternatives: ["gastro esophageal", "GERD", "acid reflux"], category: "diagnosis" },
      { term: "cholecystectomy", alternatives: ["cole a cis tectomy", "gallbladder removal"], category: "procedure" },
      { term: "colonoscopy", alternatives: ["colon oscopy", "cole on oscopy"], category: "procedure" },
      { term: "echocardiogram", alternatives: ["echo cardio gram", "echo"], category: "procedure" },
      { term: "bilateral", alternatives: ["by lateral", "bi lateral"], category: "anatomy" },
      { term: "epigastric", alternatives: ["epi gastric", "epa gastric"], category: "anatomy" },
      { term: "subcutaneous", alternatives: ["sub q taneous", "sub cute aneous"], category: "anatomy" },
    ];

    for (const term of commonTerms) {
      await ctx.db.insert("customDictionary", {
        providerId: args.providerId,
        ...term,
        createdAt: Date.now(),
      });
    }
  },
});
