"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { fmtDate, categoryConfig } from "@/lib/utils";
import type { Encounter, Note, EncounterTodo, Diagnosis } from "@/types";
import type { PatientResult } from "./PatientSearch";
import {
  Calendar,
  Activity,
  ClipboardList,
  Pill,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Circle,
  Hash,
} from "lucide-react";

interface PatientSummaryProps {
  patient: PatientResult;
  className?: string;
}

interface EncounterWithNote extends Encounter {
  notes?: Note[];
  encounter_todos?: EncounterTodo[];
}

export default function PatientSummary({ patient, className }: PatientSummaryProps) {
  const { provider } = useProvider();
  const supabase = createClient();

  const [encounters, setEncounters] = useState<EncounterWithNote[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [latestTodos, setLatestTodos] = useState<EncounterTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatientData = useCallback(async () => {
    if (!provider) return;
    setLoading(true);

    // Build encounter query
    let encounterQuery = supabase
      .from("encounters")
      .select("*")
      .eq("provider_id", provider.id)
      .eq("patient_name", patient.patient_name)
      .order("date_of_service", { ascending: false });

    if (patient.patient_id) {
      encounterQuery = encounterQuery.eq("patient_id", patient.patient_id);
    }

    const { data: encounterData } = await encounterQuery;

    if (!encounterData || encounterData.length === 0) {
      setEncounters([]);
      setAllNotes([]);
      setLatestTodos([]);
      setLoading(false);
      return;
    }

    setEncounters(encounterData);
    const encounterIds = encounterData.map((e: Encounter) => e.id);

    // Fetch notes and todos for all encounters in parallel
    const [notesRes, todosRes] = await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .in("encounter_id", encounterIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("encounter_todos")
        .select("*")
        .eq("encounter_id", encounterData[0].id)
        .order("created_at", { ascending: false }),
    ]);

    if (notesRes.data) setAllNotes(notesRes.data);
    if (todosRes.data) setLatestTodos(todosRes.data);

    setLoading(false);
  }, [provider, patient.patient_name, patient.patient_id, supabase]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  if (loading) {
    return (
      <Card className={`${className || ""} animate-fade-in`}>
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-sm">Loading patient summary...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (encounters.length === 0) {
    return (
      <Card className={`${className || ""} animate-fade-in`}>
        <div className="p-8 text-center text-slate-500">
          <p className="text-sm">No encounters found for this patient.</p>
        </div>
      </Card>
    );
  }

  // Compute summary data
  const totalVisits = encounters.length;
  const firstVisit = encounters[encounters.length - 1].date_of_service;
  const lastVisit = encounters[0].date_of_service;

  // Collect all diagnoses across notes
  const diagnosisMap = new Map<string, Diagnosis & { noteDate: string }>();
  for (const note of allNotes) {
    if (note.diagnoses) {
      for (const dx of note.diagnoses) {
        const key = dx.icd10 || dx.name;
        if (!diagnosisMap.has(key)) {
          const matchingEnc = encounters.find((e) => e.id === note.encounter_id);
          diagnosisMap.set(key, {
            ...dx,
            noteDate: matchingEnc?.date_of_service || note.created_at,
          });
        }
      }
    }
  }
  const diagnoses = Array.from(diagnosisMap.values());

  // Extract medications from note sections
  const medications = new Set<string>();
  const allergies = new Set<string>();
  for (const note of allNotes) {
    if (note.sections) {
      for (const section of note.sections) {
        const titleLower = section.title.toLowerCase();
        if (titleLower.includes("medication") || titleLower.includes("med")) {
          const lines = section.content.split("\n").filter((l) => l.trim());
          lines.forEach((l) => medications.add(l.replace(/^[-•*]\s*/, "").trim()));
        }
        if (titleLower.includes("allerg")) {
          const lines = section.content.split("\n").filter((l) => l.trim());
          lines.forEach((l) => allergies.add(l.replace(/^[-•*]\s*/, "").trim()));
        }
      }
    }
  }

  // Template usage
  const templateCounts = new Map<string, number>();
  for (const enc of encounters) {
    if (enc.template_id) {
      templateCounts.set(enc.template_id, (templateCounts.get(enc.template_id) || 0) + 1);
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      {/* Visit History */}
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Visit History</h3>
          <Badge className="ml-auto">{totalVisits} visit{totalVisits !== 1 ? "s" : ""}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">First Visit</div>
              <div className="text-sm text-slate-300">{fmtDate(firstVisit)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Last Visit</div>
              <div className="text-sm text-slate-300">{fmtDate(lastVisit)}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-auto">
            {encounters.map((enc, i) => (
              <div
                key={enc.id}
                className="stagger-item flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-xs text-slate-400 w-24 flex-shrink-0">{fmtDate(enc.date_of_service)}</span>
                <span className="text-xs text-slate-300 truncate flex-1">
                  {enc.chief_complaint || "No chief complaint"}
                </span>
                <Badge variant={enc.status as "recording" | "review" | "complete"}>
                  {enc.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnoses & Plans */}
      {diagnoses.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Diagnoses & Plans</h3>
            <Badge className="ml-auto">{diagnoses.length}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 max-h-[300px] overflow-auto">
            {diagnoses.map((dx, i) => (
              <div
                key={dx.id || i}
                className="stagger-item p-3 rounded-lg border border-slate-700/30 bg-slate-800/30"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-200">{dx.name}</span>
                  {dx.icd10 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-700/50 text-slate-400">
                      <Hash className="w-2.5 h-2.5" />
                      {dx.icd10}
                    </span>
                  )}
                </div>
                {dx.bluf && (
                  <p className="text-xs text-slate-400 italic mb-1">{dx.bluf}</p>
                )}
                {dx.ordered_planned && dx.ordered_planned.length > 0 && (
                  <div className="mt-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Plan</div>
                    <ul className="flex flex-col gap-0.5">
                      {dx.ordered_planned.map((item, j) => (
                        <li key={j} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Due Outs from Last Visit */}
      {latestTodos.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">Due Outs from Last Visit</h3>
            <span className="text-xs text-slate-500 ml-auto">{fmtDate(lastVisit)}</span>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {latestTodos.map((todo, i) => {
              const cc = categoryConfig[todo.category];
              return (
                <div
                  key={todo.id}
                  className="stagger-item flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-700/30"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {todo.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span className={`text-xs flex-1 ${todo.done ? "line-through text-slate-500" : "text-slate-300"}`}>
                    {todo.text}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cc?.bg || "bg-slate-800/50"} ${cc?.text || "text-slate-400"}`}
                  >
                    {todo.category}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick Facts */}
      {(medications.size > 0 || allergies.size > 0) && (
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-slate-200">Quick Facts</h3>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {medications.size > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Pill className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Medications</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(medications).slice(0, 12).map((med, i) => (
                    <span
                      key={i}
                      className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {allergies.size > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Allergies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(allergies).slice(0, 8).map((allergy, i) => (
                    <span
                      key={i}
                      className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-red-500/10 text-red-300 border border-red-500/20"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
