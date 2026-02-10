import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    specialty: v.optional(v.string()),
    credentials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("providers", {
      name: args.name,
      email: args.email,
      specialty: args.specialty ?? "",
      credentials: args.credentials ?? "",
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const update = mutation({
  args: {
    id: v.id("providers"),
    name: v.optional(v.string()),
    specialty: v.optional(v.string()),
    credentials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, string> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.specialty !== undefined) updates.specialty = fields.specialty;
    if (fields.credentials !== undefined) updates.credentials = fields.credentials;
    await ctx.db.patch(id, updates);
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("providers").collect();
  },
});
