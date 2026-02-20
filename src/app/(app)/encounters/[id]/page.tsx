"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import CopyButton from "@/components/ui/CopyButton";
import { statusConfig, fmtDateTime, fmtDuration, categoryConfig } from "@/lib/utils";
import type {
  Encounter,
  Template,
  TranscriptSegment,
  Note,
  NoteSection,
  Diagnosis,
  EncounterTodo,
  ProviderTodo,
  DictionaryEntry,
  ScrubCorrection,
  PersonalContentFlag,
} from "@/types";
import {
  ArrowLeft,
  Mic,
  Square,
  Clock,
  Sparkles,
  Shield,
  BookOpen,
  Plus,
  Trash2,
  Check,
  X,
  Pencil,
  Save,
  ArrowRight,
} from "lucide-react";

type Tab = "transcript" | "scrub" | "note" | "todos";

export default function EncounterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { provider } = useProvider();

  // Core data
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [encTodos, setEncTodos] = useState<EncounterTodo[]>([]);
  const [provTodos, setProvTodos] = useState<ProviderTodo[]>([]);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [corrections, setCorrections] = useState<ScrubCorrection[]>([]);
  const [personalFlags, setPersonalFlags] = useState<PersonalContentFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<Tab>("transcript");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Dictionary add form
  const [showAddTerm, setShowAddTerm] = useState(false);
  const [newWrong, setNewWrong] = useState("");
  const [newCorrect, setNewCorrect] = useState("");
  const [newCat, setNewCat] = useState<"medical" | "military" | "names" | "custom">("medical");
  const [dictFilter, setDictFilter] = useState("all");

  const fetchData = useCallback(async () => {
    if (!provider) return;

    const [encRes, tplRes, segRes, noteRes, etRes, ptRes, dictRes, corrRes, pfRes] =
      await Promise.all([
        supabase.from("encounters").select("*").eq("id", params.id).single(),
        supabase.from("templates").select("*").order("is_default", { ascending: false }),
        supabase
          .from("transcript_segments")
          .select("*")
          .eq("encounter_id", params.id)
          .order("segment_order", { ascending: true }),
        supabase.from("notes").select("*").eq("encounter_id", params.id).single(),
        supabase
          .from("encounter_todos")
          .select("*")
          .eq("encounter_id", params.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("provider_todos")
          .select("*")
          .eq("provider_id", provider.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("dictionary")
          .select("*")
          .eq("provider_id", provider.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("scrub_corrections")
          .select("*")
          .eq("encounter_id", params.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("personal_content_flags")
          .select("*")
          .eq("encounter_id", params.id)
          .order("created_at", { ascending: true }),
      ]);

    if (encRes.data) {
      setEncounter(encRes.data);
      setSelectedTemplateId(encRes.data.template_id || "");
    }
    if (tplRes.data) setTemplates(tplRes.data);
    if (segRes.data) setSegments(segRes.data);
    if (noteRes.data) setNote(noteRes.data);
    if (etRes.data) setEncTodos(etRes.data);
    if (ptRes.data) setProvTodos(ptRes.data);
    if (dictRes.data) setDictionary(dictRes.data);
    if (corrRes.data) setCorrections(corrRes.data);
    if (pfRes.data) setPersonalFlags(pfRes.data);
    setLoading(false);
  }, [provider, params.id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recording timer
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (isRecording) t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  // Template change
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    await supabase
      .from("encounters")
      .update({ template_id: templateId || null })
      .eq("id", params.id);
  };

  // Toggle scrub correction
  const toggleCorrection = async (id: string, accepted: boolean) => {
    setCorrections((cs) => cs.map((c) => (c.id === id ? { ...c, accepted: !accepted } : c)));
    await supabase.from("scrub_corrections").update({ accepted: !accepted }).eq("id", id);
  };

  // Toggle personal flag
  const togglePersonalFlag = async (id: string, flagged: boolean) => {
    setPersonalFlags((fs) => fs.map((f) => (f.id === id ? { ...f, flagged: !flagged } : f)));
    await supabase.from("personal_content_flags").update({ flagged: !flagged }).eq("id", id);
  };

  // Dictionary management
  const addDictTerm = async () => {
    if (!newWrong.trim() || !newCorrect.trim() || !provider) return;
    const { data } = await supabase
      .from("dictionary")
      .insert({
        provider_id: provider.id,
        wrong_text: newWrong.trim(),
        correct_text: newCorrect.trim(),
        category: newCat,
        enabled: true,
      })
      .select()
      .single();
    if (data) {
      setDictionary([data, ...dictionary]);
      setNewWrong("");
      setNewCorrect("");
      setShowAddTerm(false);
    }
  };

  const toggleDictTerm = async (id: string, enabled: boolean) => {
    setDictionary((ds) => ds.map((d) => (d.id === id ? { ...d, enabled: !enabled } : d)));
    await supabase.from("dictionary").update({ enabled: !enabled }).eq("id", id);
  };

  const removeDictTerm = async (id: string) => {
    setDictionary((ds) => ds.filter((d) => d.id !== id));
    await supabase.from("dictionary").delete().eq("id", id);
  };

  // Encounter todos
  const toggleEncTodo = async (id: string, done: boolean) => {
    setEncTodos((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !done, completed_at: !done ? new Date().toISOString() : null } : t))
    );
    await supabase
      .from("encounter_todos")
      .update({ done: !done, completed_at: !done ? new Date().toISOString() : null })
      .eq("id", id);
  };

  // Provider todos
  const toggleProvTodo = async (id: string, done: boolean) => {
    setProvTodos((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !done, completed_at: !done ? new Date().toISOString() : null } : t))
    );
    await supabase
      .from("provider_todos")
      .update({ done: !done, completed_at: !done ? new Date().toISOString() : null })
      .eq("id", id);
  };

  const [newProvTodo, setNewProvTodo] = useState("");
  const addProvTodo = async () => {
    if (!newProvTodo.trim() || !provider || !encounter) return;
    const { data } = await supabase
      .from("provider_todos")
      .insert({
        provider_id: provider.id,
        encounter_id: encounter.id,
        text: newProvTodo.trim(),
        encounter_label: encounter.patient_name,
      })
      .select()
      .single();
    if (data) {
      setProvTodos([data, ...provTodos]);
      setNewProvTodo("");
    }
  };

  // Note section editing
  const saveSection = async (sectionId: string) => {
    if (!note) return;
    const updatedSections = (note.sections as NoteSection[]).map((s) =>
      s.section_id === sectionId ? { ...s, content: editValue } : s
    );
    setNote({ ...note, sections: updatedSections });
    setEditingSection(null);
    await supabase.from("notes").update({ sections: updatedSections }).eq("id", note.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Loading encounter...</p>
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-slate-400">Encounter not found</p>
        <Button variant="ghost" onClick={() => router.push("/encounters")}>
          Back to Encounters
        </Button>
      </div>
    );
  }

  const sc = statusConfig[encounter.status];
  const noteSections = (note?.sections || []) as NoteSection[];
  const diagnoses = (note?.diagnoses || []) as Diagnosis[];
  const filteredDict = dictionary.filter((d) => dictFilter === "all" || d.category === dictFilter);

  // Group note sections by their group from the template
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const templateSections = (selectedTemplate?.sections || []) as {
    id: string;
    group: string;
    title: string;
    format: string;
    order: number;
  }[];

  // Build a map from section_id to group
  const sectionGroupMap: Record<string, string> = {};
  templateSections.forEach((ts) => {
    sectionGroupMap[ts.id] = ts.group;
  });

  // Group the note sections
  const groupedNoteSections: Record<string, NoteSection[]> = {};
  noteSections.forEach((ns) => {
    const group = sectionGroupMap[ns.section_id] || "Other";
    if (!groupedNoteSections[group]) groupedNoteSections[group] = [];
    groupedNoteSections[group].push(ns);
  });

  const groupOrder = ["Subjective", "Objective", "Assessment & Plan", "Orders", "Narrative", "Other"];
  const sortedNoteGroups = groupOrder.filter((g) => groupedNoteSections[g]?.length);

  // Full transcript text for copy
  const transcriptText = segments
    .map((s) => `${s.speaker === "provider" ? "Provider" : s.speaker === "patient" ? "Patient" : "Unknown"}: ${s.text}`)
    .join("\n\n");

  // Full note text for copy
  const fullNoteText = noteSections.map((s) => `${s.title}\n${s.content}`).join("\n\n");

  const dictCategoryColors: Record<string, { bg: string; text: string; border: string }> = {
    medical: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    military: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    names: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    custom: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-700/50" },
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/encounters")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{encounter.patient_name}</h1>
            <Badge variant={encounter.status as "recording" | "review" | "complete"}>
              {sc?.label || encounter.status}
            </Badge>
          </div>
          <div className="flex gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {fmtDateTime(encounter.date_of_service)}
            </span>
            {encounter.chief_complaint && <span>CC: {encounter.chief_complaint}</span>}
            {encounter.patient_id && <span>MRN: {encounter.patient_id}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">Template:</label>
          <Select
            className="w-56"
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Recording Bar */}
      <Card className="p-3 flex items-center gap-3">
        {!isRecording ? (
          <Button size="lg" onClick={() => setIsRecording(true)}>
            <Mic className="w-4 h-4" /> Start Recording
          </Button>
        ) : (
          <Button variant="destructive" size="lg" onClick={() => { setIsRecording(false); setTab("scrub"); }}>
            <Square className="w-3.5 h-3.5" /> Stop & Review
          </Button>
        )}
        {/* Flow indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={`px-2 py-0.5 rounded-full font-medium ${tab === "transcript" ? "bg-blue-600 text-white" : "bg-slate-700/50 text-slate-400"}`}>
            1. Record
          </span>
          <ArrowRight className="w-3 h-3" />
          <span className={`px-2 py-0.5 rounded-full font-medium ${tab === "scrub" ? "bg-amber-500 text-white" : "bg-slate-700/50 text-slate-400"}`}>
            2. Scrub
          </span>
          <ArrowRight className="w-3 h-3" />
          <span className={`px-2 py-0.5 rounded-full font-medium ${tab === "note" && note ? "bg-green-500 text-white" : "bg-slate-700/50 text-slate-400"}`}>
            3. Note
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {isRecording && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-xl font-bold font-mono">{fmtDuration(duration)}</span>
        </div>
      </Card>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b-2 border-slate-700/50">
        {([
          { id: "transcript" as Tab, label: "Live Transcript" },
          { id: "scrub" as Tab, label: `Scrub & Dictionary (${corrections.filter((c) => c.accepted).length} fixes)` },
          { id: "note" as Tab, label: "Clinical Note" },
          { id: "todos" as Tab, label: "To-Do Lists" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[2px] transition-colors cursor-pointer ${
              tab === t.id
                ? "text-blue-400 border-blue-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TRANSCRIPT TAB ===== */}
      {tab === "transcript" && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-end">
            {segments.length > 0 && <CopyButton text={transcriptText} label="Copy Transcript" />}
          </div>
          <Card className="p-5 min-h-[450px] max-h-[550px] overflow-auto bg-slate-900/30 flex flex-col gap-3">
            {segments.length === 0 && !isRecording && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <Mic className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm font-medium">No transcript yet</p>
                <p className="text-xs mt-1">Start recording to begin transcription</p>
              </div>
            )}
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`flex ${seg.speaker === "provider" ? "justify-start pr-16" : "justify-end pl-16"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    seg.speaker === "provider"
                      ? "bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl"
                      : "bg-blue-600 text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${seg.speaker === "provider" ? "" : "opacity-85"}`}>
                      {seg.speaker === "provider"
                        ? seg.speaker_name || "Provider"
                        : seg.speaker === "patient"
                          ? seg.speaker_name || "Patient"
                          : "Unknown"}
                    </span>
                    <span className="text-[10px] opacity-50">{fmtDuration(seg.start_time)}</span>
                  </div>
                  {seg.text}
                </div>
              </div>
            ))}
            {isRecording && (
              <div className="flex justify-start pr-16">
                <div className="px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl text-sm text-slate-400 italic">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse [animation-delay:0.4s]" />
                  </span>
                  {" "}Listening...
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===== SCRUB TAB ===== */}
      {tab === "scrub" && (
        <div className="flex flex-col gap-4">
          {/* Scrub banner */}
          <Card className="p-3 bg-amber-500/10 border-amber-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-300" />
              <div>
                <div className="text-sm font-semibold text-amber-200">Transcript Scrub & Review</div>
                <div className="text-xs text-amber-300">
                  {corrections.filter((c) => c.accepted).length} corrections found
                  {personalFlags.filter((f) => f.flagged).length > 0 &&
                    ` · ${personalFlags.filter((f) => f.flagged).length} personal items flagged`}
                </div>
              </div>
            </div>
            <Button size="lg" onClick={() => setTab("note")}>
              <Shield className="w-4 h-4" /> Approve & View Note
            </Button>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* LEFT: Corrections + Personal Flags */}
            <div className="flex flex-col gap-3">
              {/* Corrections */}
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <h3 className="text-sm font-semibold">Corrections Found ({corrections.length})</h3>
                  {corrections.length > 0 && (
                    <Button
                      variant={corrections.every((c) => c.accepted) ? "success" : "outline"}
                      size="sm"
                      onClick={async () => {
                        setCorrections((cs) => cs.map((c) => ({ ...c, accepted: true })));
                        const ids = corrections.map((c) => c.id);
                        if (ids.length > 0) {
                          await supabase
                            .from("scrub_corrections")
                            .update({ accepted: true })
                            .in("id", ids);
                        }
                      }}
                    >
                      Accept All
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2 max-h-[350px] overflow-auto">
                  {corrections.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No corrections found. Run the scrub process after recording.
                    </p>
                  )}
                  {corrections.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => toggleCorrection(c.id, c.accepted)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        c.accepted
                          ? "border-green-500/30 bg-green-500/10"
                          : "border-slate-700/50 bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4.5 h-4.5 rounded flex-shrink-0 flex items-center justify-center ${
                            c.accepted
                              ? "bg-green-500 text-white"
                              : "border-2 border-slate-600"
                          }`}
                        >
                          {c.accepted && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm text-red-500 line-through font-medium">
                          {c.original_text}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-sm text-green-400 font-semibold">
                          {c.corrected_text}
                        </span>
                      </div>
                      {c.context && (
                        <div className="text-xs text-slate-400 pl-6 italic">{c.context}</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Personal Content Flags */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold">
                    Personal Content Flagged ({personalFlags.filter((f) => f.flagged).length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Non-clinical content detected — will be removed from note
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {personalFlags.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No personal content detected
                    </p>
                  )}
                  {personalFlags.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => togglePersonalFlag(f.id, f.flagged)}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        f.flagged ? "border-red-500/30 bg-red-500/10" : "border-slate-700/50 bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4.5 h-4.5 rounded flex-shrink-0 flex items-center justify-center ${
                            f.flagged ? "bg-red-500 text-white" : "border-2 border-slate-600"
                          }`}
                        >
                          {f.flagged && <X className="w-3 h-3" />}
                        </div>
                        <span
                          className={`text-sm ${f.flagged ? "text-slate-500 line-through" : ""}`}
                        >
                          &ldquo;{f.text_content}&rdquo;
                        </span>
                      </div>
                      <div className="text-[11px] text-red-500 pl-6 mt-1">
                        {f.flagged ? "Will be removed from note" : "Click to flag for removal"}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Dictionary Manager */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Dictionary ({dictionary.filter((d) => d.enabled).length} active)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Words that get misspelled in transcription
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowAddTerm(!showAddTerm)}>
                  <Plus className="w-3.5 h-3.5" /> Add Term
                </Button>
              </CardHeader>

              {showAddTerm && (
                <div className="px-5 py-3 bg-slate-900/30 border-b border-slate-700/30">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[11px] font-medium block mb-0.5">
                        Misspelled / Misheard
                      </label>
                      <Input
                        value={newWrong}
                        onChange={(e) => setNewWrong(e.target.value)}
                        placeholder="e.g., sea ram"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-0.5">
                        Correct Spelling
                      </label>
                      <Input
                        value={newCorrect}
                        onChange={(e) => setNewCorrect(e.target.value)}
                        placeholder="e.g., C-RAM"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select
                      className="w-36"
                      value={newCat}
                      onChange={(e) =>
                        setNewCat(e.target.value as "medical" | "military" | "names" | "custom")
                      }
                    >
                      <option value="medical">Medical</option>
                      <option value="military">Military</option>
                      <option value="names">Names/Locations</option>
                      <option value="custom">Custom</option>
                    </Select>
                    <Button size="sm" onClick={addDictTerm}>
                      Add to Dictionary
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddTerm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Filter tabs */}
              <div className="px-5 py-2 border-b border-slate-700/30 flex gap-1.5">
                {["all", "medical", "military", "names", "custom"].map((f) => {
                  const count =
                    f === "all" ? dictionary.length : dictionary.filter((d) => d.category === f).length;
                  return (
                    <Button
                      key={f}
                      variant={dictFilter === f ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setDictFilter(f)}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                    </Button>
                  );
                })}
              </div>

              {/* Dictionary entries */}
              <CardContent className="flex flex-col gap-1.5 max-h-[420px] overflow-auto">
                {filteredDict.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No dictionary entries</p>
                )}
                {filteredDict.map((d) => {
                  const cc = dictCategoryColors[d.category];
                  return (
                    <div
                      key={d.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700/30 ${
                        d.enabled ? "bg-slate-800/50" : "bg-slate-900/30 opacity-60"
                      }`}
                    >
                      <button
                        onClick={() => toggleDictTerm(d.id, d.enabled)}
                        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center cursor-pointer ${
                          d.enabled
                            ? "bg-blue-600 text-white"
                            : "border-2 border-slate-600"
                        }`}
                      >
                        {d.enabled && <span className="text-[10px]">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-xs text-red-500 line-through">{d.wrong_text}</span>
                        <span className="text-slate-500 text-[10px]">→</span>
                        <span className="text-xs font-semibold">{d.correct_text}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cc?.bg || ""} ${cc?.text || ""}`}
                      >
                        {d.category}
                      </span>
                      <button
                        onClick={() => removeDictTerm(d.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== NOTE TAB ===== */}
      {tab === "note" && (
        <>
          {note ? (
            <div className="flex flex-col gap-3">
              {/* Note banner */}
              <Card className="p-3 bg-green-500/10 border-green-500/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300 font-medium">
                  Note generated from transcript
                </span>
                <div className="ml-auto">
                  <CopyButton text={fullNoteText} label="Copy Full Note" />
                </div>
              </Card>

              {/* Sections grouped */}
              {sortedNoteGroups.map((group) => (
                <Card key={group} className="overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
                    <h3 className="text-sm font-bold text-slate-300 uppercase">{group}</h3>
                  </div>
                  {groupedNoteSections[group].map((section) => (
                    <div key={section.section_id} className="px-4 py-3 border-b border-slate-700/30 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-slate-400">{section.title}</h4>
                        <div className="flex gap-1.5">
                          <CopyButton text={section.content} label="Copy" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSection(section.section_id);
                              setEditValue(section.content);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {editingSection === section.section_id ? (
                        <div>
                          <Textarea
                            className="min-h-[100px] font-mono text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => saveSection(section.section_id)}>
                              <Save className="w-3.5 h-3.5" /> Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSection(null)}
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: section.content.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong class="text-white">$1</strong>'
                            ),
                          }}
                        />
                      )}
                    </div>
                  ))}
                </Card>
              ))}

              {/* Diagnoses with BLUF format */}
              {diagnoses.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-300 uppercase">
                      Assessment & Plan — Diagnoses
                    </h3>
                    <CopyButton
                      text={diagnoses
                        .map(
                          (dx) =>
                            `BLUF — ${dx.name} (${dx.icd10})\n${dx.bluf}\n\n${dx.narrative}\n\nPreviously completed:\n${dx.prev_completed.map((p) => `- ${p}`).join("\n")}\n\nOrdered / Planned:\n${dx.ordered_planned.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
                        )
                        .join("\n\n---\n\n")}
                      label="Copy All A&P"
                    />
                  </div>
                  {diagnoses.map((dx, di) => (
                    <div
                      key={dx.id}
                      className={`px-4 py-4 ${di < diagnoses.length - 1 ? "border-b-2 border-slate-700/50" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white mb-1">
                            BLUF — {dx.name}{" "}
                            <span className="font-normal text-xs text-slate-400">({dx.icd10})</span>
                          </div>
                          <div className="text-sm text-slate-300 leading-relaxed italic">
                            {dx.bluf}
                          </div>
                        </div>
                        <CopyButton
                          text={`BLUF — ${dx.name} (${dx.icd10})\n${dx.bluf}\n\n${dx.narrative}\n\nPreviously completed:\n${dx.prev_completed.map((p) => `- ${p}`).join("\n")}\n\nOrdered / Planned:\n${dx.ordered_planned.map((p, i) => `${i + 1}. ${p}`).join("\n")}`}
                          label="Copy"
                        />
                      </div>
                      <div className="text-sm leading-[1.7] text-slate-300 whitespace-pre-wrap">
                        {dx.narrative}
                      </div>
                      {dx.prev_completed.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-slate-400 mb-1">
                            Previously completed (results in parentheses):
                          </div>
                          {dx.prev_completed.map((p, i) => (
                            <div key={i} className="text-sm text-slate-300 pl-2">
                              - {p}
                            </div>
                          ))}
                        </div>
                      )}
                      {dx.ordered_planned.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-slate-400 mb-1">
                            Ordered / Planned (in order):
                          </div>
                          {dx.ordered_planned.map((p, i) => (
                            <div key={i} className="text-sm text-slate-300 pl-2">
                              {i + 1}. {p}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              )}

              {/* If note has no grouped sections and no diagnoses, show the full text */}
              {noteSections.length === 0 && diagnoses.length === 0 && note.full_text && (
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <h3 className="text-sm font-semibold">Generated Note</h3>
                    <CopyButton text={note.full_text} label="Copy" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {note.full_text}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm font-medium">Record a conversation, then generate a note</p>
              <p className="text-xs mt-1">
                The note will auto-build using your selected template
              </p>
            </div>
          )}
        </>
      )}

      {/* ===== TODOS TAB ===== */}
      {tab === "todos" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Encounter Todos */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold">Encounter To-Do List</h3>
              <p className="text-xs text-slate-400 mt-0.5">Items for this patient visit</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {encTodos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No to-do items for this encounter
                </p>
              )}
              {encTodos.map((t) => {
                const cc = categoryConfig[t.category];
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleEncTodo(t.id, t.done)}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 cursor-pointer ${
                      t.done ? "bg-slate-900/30" : "bg-slate-800/50 hover:bg-slate-700/30"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center ${
                        t.done ? "bg-green-500 text-white" : "border-2 border-slate-600"
                      }`}
                    >
                      {t.done && <Check className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-sm flex-1 ${t.done ? "line-through text-slate-500" : ""}`}
                    >
                      {t.text}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cc?.bg || "bg-slate-700/30"} ${cc?.text || "text-slate-400"}`}
                    >
                      {t.category}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Provider Todos */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold">Provider To-Do List</h3>
              <p className="text-xs text-slate-400 mt-0.5">Persistent across all encounters</p>
            </CardHeader>
            <div className="px-5 pb-2 border-b border-slate-700/30">
              <div className="flex gap-2">
                <Input
                  placeholder="Add to-do..."
                  value={newProvTodo}
                  onChange={(e) => setNewProvTodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addProvTodo()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addProvTodo}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <CardContent className="flex flex-col gap-2">
              {provTodos.map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleProvTodo(t.id, t.done)}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 cursor-pointer ${
                    t.done ? "bg-slate-900/30" : "bg-slate-800/50 hover:bg-slate-700/30"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center ${
                      t.done ? "bg-green-500 text-white" : "border-2 border-slate-600"
                    }`}
                  >
                    {t.done && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-sm ${t.done ? "line-through text-slate-500" : ""}`}
                    >
                      {t.text}
                    </span>
                    {t.encounter_label && (
                      <div className="text-xs text-slate-400">{t.encounter_label}</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
