import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const addSegment = mutation({
  args: {
    encounterId: v.id("encounters"),
    speaker: v.string(),
    speakerName: v.optional(v.string()),
    text: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    confidence: v.optional(v.number()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcriptSegments", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const addBatchSegments = mutation({
  args: {
    segments: v.array(
      v.object({
        encounterId: v.id("encounters"),
        speaker: v.string(),
        speakerName: v.optional(v.string()),
        text: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        confidence: v.optional(v.number()),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const segment of args.segments) {
      const id = await ctx.db.insert("transcriptSegments", {
        ...segment,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const getByEncounter = query({
  args: { encounterId: v.id("encounters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcriptSegments")
      .withIndex("by_encounter_order", (q) =>
        q.eq("encounterId", args.encounterId)
      )
      .collect();
  },
});

export const updateSegment = mutation({
  args: {
    id: v.id("transcriptSegments"),
    text: v.optional(v.string()),
    speaker: v.optional(v.string()),
    speakerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const deleteByEncounter = mutation({
  args: { encounterId: v.id("encounters") },
  handler: async (ctx, args) => {
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_encounter", (q) => q.eq("encounterId", args.encounterId))
      .collect();
    for (const segment of segments) {
      await ctx.db.delete(segment._id);
    }
  },
});

export const getFullTranscript = query({
  args: { encounterId: v.id("encounters") },
  handler: async (ctx, args) => {
    const segments = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_encounter_order", (q) =>
        q.eq("encounterId", args.encounterId)
      )
      .collect();

    return segments
      .map((s) => `${s.speakerName || s.speaker}: ${s.text}`)
      .join("\n");
  },
});
