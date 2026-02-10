import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("voiceProfiles")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("voiceProfiles", {
      providerId: args.providerId,
      voiceSampleIds: [],
      enrollmentComplete: false,
      sampleCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceProfiles")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .first();
  },
});

export const addSample = mutation({
  args: {
    profileId: v.id("voiceProfiles"),
    audioData: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const sampleId = await ctx.db.insert("voiceSamples", {
      profileId: args.profileId,
      audioData: args.audioData,
      duration: args.duration,
      createdAt: Date.now(),
    });

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    const newSampleIds = [...profile.voiceSampleIds, sampleId];
    const newCount = profile.sampleCount + 1;

    await ctx.db.patch(args.profileId, {
      voiceSampleIds: newSampleIds,
      sampleCount: newCount,
      enrollmentComplete: newCount >= 3, // require at least 3 samples
      updatedAt: Date.now(),
    });

    return sampleId;
  },
});

export const getSamples = query({
  args: { profileId: v.id("voiceProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSamples")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();
  },
});

export const deleteSample = mutation({
  args: {
    sampleId: v.id("voiceSamples"),
    profileId: v.id("voiceProfiles"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sampleId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return;

    const newSampleIds = profile.voiceSampleIds.filter(
      (id) => id !== args.sampleId
    );
    const newCount = Math.max(0, profile.sampleCount - 1);

    await ctx.db.patch(args.profileId, {
      voiceSampleIds: newSampleIds,
      sampleCount: newCount,
      enrollmentComplete: newCount >= 3,
      updatedAt: Date.now(),
    });
  },
});

export const resetProfile = mutation({
  args: { profileId: v.id("voiceProfiles") },
  handler: async (ctx, args) => {
    // Delete all samples
    const samples = await ctx.db
      .query("voiceSamples")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    for (const sample of samples) {
      await ctx.db.delete(sample._id);
    }

    await ctx.db.patch(args.profileId, {
      voiceSampleIds: [],
      sampleCount: 0,
      enrollmentComplete: false,
      updatedAt: Date.now(),
    });
  },
});
