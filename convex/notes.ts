import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const create = mutation({
  args: {
    encounterId: v.id("encounters"),
    templateId: v.id("templates"),
    providerId: v.id("providers"),
    sections: v.array(
      v.object({
        sectionId: v.string(),
        title: v.string(),
        content: v.string(),
      })
    ),
    fullText: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getByEncounter = query({
  args: { encounterId: v.id("encounters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_encounter", (q) => q.eq("encounterId", args.encounterId))
      .first();
  },
});

export const get = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();
  },
});

export const updateSection = mutation({
  args: {
    id: v.id("notes"),
    sectionId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");

    const sections = note.sections.map((s) =>
      s.sectionId === args.sectionId ? { ...s, content: args.content } : s
    );
    const fullText = sections.map((s) => `## ${s.title}\n${s.content}`).join("\n\n");

    await ctx.db.patch(args.id, {
      sections,
      fullText,
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("notes"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "signed") {
      updates.signedAt = Date.now();
    }
    await ctx.db.patch(args.id, updates);
  },
});

// AI Note Generation action
export const generateFromTranscript = action({
  args: {
    encounterId: v.id("encounters"),
    templateId: v.id("templates"),
    providerId: v.id("providers"),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get transcript
    const transcript = await ctx.runQuery(api.transcripts.getFullTranscript, {
      encounterId: args.encounterId,
    });

    // Get template
    const template = await ctx.runQuery(api.templates.get, {
      id: args.templateId,
    });

    if (!template) throw new Error("Template not found");
    if (!transcript) throw new Error("No transcript found");

    // Get custom dictionary for the provider
    const dictionary = await ctx.runQuery(api.dictionary.listByProvider, {
      providerId: args.providerId,
    });

    const dictionaryContext = dictionary.length > 0
      ? `\n\nCustom Medical Dictionary (use these exact spellings):\n${dictionary.map((d) => `- ${d.term} (alternatives: ${d.alternatives.join(", ")})`).join("\n")}`
      : "";

    // Build prompt for AI
    const sectionPrompts = template.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => `### ${s.title} (ID: ${s.id})\n${s.description}\nGuidance: ${s.placeholder}`)
      .join("\n\n");

    const prompt = `You are an expert medical scribe. Generate a clinical note from the following provider-patient conversation transcript using the specified template format. Be thorough, accurate, and use proper medical terminology. Only include information that was discussed in the conversation. If information for a section was not discussed, write "Not discussed during this encounter."${dictionaryContext}

## Template: ${template.name}
${sectionPrompts}

## Transcript:
${transcript}

Generate the note with each section clearly labeled. Return ONLY a JSON array of objects with "sectionId", "title", and "content" fields matching the template sections above. The content should be professionally written clinical documentation.`;

    // Call OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Generate a placeholder note if no API key
      const sections = template.sections.map((s) => ({
        sectionId: s.id,
        title: s.title,
        content: `[AI generation requires OPENAI_API_KEY] Based on transcript:\n${transcript.substring(0, 200)}...`,
      }));

      const fullText = sections
        .map((s) => `## ${s.title}\n${s.content}`)
        .join("\n\n");

      const noteId = await ctx.runMutation(api.notes.create, {
        encounterId: args.encounterId,
        templateId: args.templateId,
        providerId: args.providerId,
        sections,
        fullText,
        status: "draft",
      });

      await ctx.runMutation(api.encounters.updateStatus, {
        id: args.encounterId,
        status: "review",
      });

      return noteId;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert medical scribe. Always respond with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let sections;
    try {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      sections = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      // Fallback: create sections from raw text
      sections = template.sections.map((s) => ({
        sectionId: s.id,
        title: s.title,
        content: content || "Failed to generate content",
      }));
    }

    const fullText = sections
      .map((s: { title: string; content: string }) => `## ${s.title}\n${s.content}`)
      .join("\n\n");

    const noteId = await ctx.runMutation(api.notes.create, {
      encounterId: args.encounterId,
      templateId: args.templateId,
      providerId: args.providerId,
      sections,
      fullText,
      status: "draft",
    });

    await ctx.runMutation(api.encounters.updateStatus, {
      id: args.encounterId,
      status: "review",
    });

    return noteId;
  },
});
