import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    providerId: v.id("providers"),
    patientName: v.string(),
    patientId: v.optional(v.string()),
    chiefComplaint: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("encounters", {
      providerId: args.providerId,
      patientName: args.patientName,
      patientId: args.patientId,
      chiefComplaint: args.chiefComplaint,
      templateId: args.templateId,
      dateOfService: Date.now(),
      status: "recording",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("encounters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("encounters")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("encounters"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("encounters"),
    patientName: v.optional(v.string()),
    patientId: v.optional(v.string()),
    chiefComplaint: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
    status: v.optional(v.string()),
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
  args: { id: v.id("encounters") },
  handler: async (ctx, args) => {
    // Delete associated transcript segments
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_encounter", (q) => q.eq("encounterId", args.id))
      .collect();
    for (const segment of segments) {
      await ctx.db.delete(segment._id);
    }

    // Delete associated notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_encounter", (q) => q.eq("encounterId", args.id))
      .collect();
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    await ctx.db.delete(args.id);
  },
});
