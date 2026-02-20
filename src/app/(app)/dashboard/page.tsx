"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { statusConfig, fmtDateTime, categoryConfig } from "@/lib/utils";
import type { Encounter, ProviderTodo, EncounterTodo } from "@/types";
import PatientSearch from "@/components/patients/PatientSearch";
import {
  Plus,
  Mic,
  Clock,
  CheckCircle2,
  ListTodo,
  Stethoscope,
  Check,
} from "lucide-react";

export default function DashboardPage() {
  const { provider } = useProvider();
  const router = useRouter();
  const supabase = createClient();

  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [providerTodos, setProviderTodos] = useState<ProviderTodo[]>([]);
  const [encounterTodos, setEncounterTodos] = useState<(EncounterTodo & { patient_name?: string })[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    if (!provider) return;

    const fetchData = async () => {
      const [encRes, ptRes, etRes] = await Promise.all([
        supabase
          .from("encounters")
          .select("*")
          .eq("provider_id", provider.id)
          .order("date_of_service", { ascending: false })
          .limit(5),
        supabase
          .from("provider_todos")
          .select("*")
          .eq("provider_id", provider.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("encounter_todos")
          .select("*, encounters!inner(patient_name)")
          .eq("encounters.provider_id", provider.id)
          .eq("done", false)
          .order("created_at", { ascending: false }),
      ]);

      if (encRes.data) setEncounters(encRes.data);
      if (ptRes.data) setProviderTodos(ptRes.data);
      if (etRes.data) {
        setEncounterTodos(
          etRes.data.map((t: Record<string, unknown>) => ({
            ...t,
            patient_name: (t.encounters as Record<string, string>)?.patient_name,
          })) as (EncounterTodo & { patient_name?: string })[]
        );
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const activeCount = encounters.filter((e) => e.status === "recording").length;
  const reviewCount = encounters.filter((e) => e.status === "review").length;
  const completeCount = encounters.filter((e) => e.status === "complete").length;
  const pendingTodos = providerTodos.filter((t) => !t.done);
  const doneTodos = providerTodos.filter((t) => t.done);

  const toggleProviderTodo = async (id: string, done: boolean) => {
    setProviderTodos((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, done: !done, completed_at: !done ? new Date().toISOString() : null } : t
      )
    );
    await supabase
      .from("provider_todos")
      .update({ done: !done, completed_at: !done ? new Date().toISOString() : null })
      .eq("id", id);
  };

  const addProviderTodo = async () => {
    if (!newTodo.trim() || !provider) return;
    const { data } = await supabase
      .from("provider_todos")
      .insert({ provider_id: provider.id, text: newTodo.trim(), encounter_label: "General" })
      .select()
      .single();
    if (data) setProviderTodos([data, ...providerTodos]);
    setNewTodo("");
  };

  const toggleEncounterTodo = async (id: string, done: boolean) => {
    setEncounterTodos((ts) => ts.filter((t) => (t.id === id ? done : true)));
    await supabase
      .from("encounter_todos")
      .update({ done: !done, completed_at: !done ? new Date().toISOString() : null })
      .eq("id", id);
  };

  const stats = [
    { value: activeCount, label: "Active Recordings", icon: Mic, bg: "bg-red-500/10", color: "text-red-400" },
    { value: reviewCount, label: "Pending Review", icon: Clock, bg: "bg-purple-500/10", color: "text-purple-400" },
    { value: completeCount, label: "Completed", icon: CheckCircle2, bg: "bg-green-500/10", color: "text-green-400" },
    { value: pendingTodos.length, label: "Provider To-Dos", icon: ListTodo, bg: "bg-orange-500/10", color: "text-orange-400" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome back, {provider?.name || "Doctor"}
          </p>
        </div>
        <Button size="lg" onClick={() => router.push("/encounters/new")}>
          <Plus className="w-4 h-4" /> New Encounter
        </Button>
      </div>

      {/* Patient Search */}
      <PatientSearch
        onSelectPatient={(patient) => {
          const params = new URLSearchParams();
          params.set("name", patient.patient_name);
          if (patient.patient_id) params.set("mrn", patient.patient_id);
          router.push(`/patients?${params.toString()}`);
        }}
        onCreateNew={(data) => {
          const params = new URLSearchParams();
          params.set("name", data.name);
          if (data.mrn) params.set("mrn", data.mrn);
          if (data.chiefComplaint) params.set("cc", data.chiefComplaint);
          router.push(`/encounters/new?${params.toString()}`);
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="stagger-item transition-lift">
            <div className="flex items-center gap-4 p-5">
              <div className={`p-3 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid: Recent Encounters + Provider To-Dos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Encounters */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">Recent Encounters</h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/encounters")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {encounters.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No encounters yet</p>
            )}
            {encounters.slice(0, 5).map((enc) => {
              const sc = statusConfig[enc.status];
              return (
                <div
                  key={enc.id}
                  onClick={() => router.push(`/encounters/${enc.id}`)}
                  className="stagger-item flex justify-between items-center p-3 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{enc.patient_name}</div>
                      <div className="text-xs text-slate-500">{enc.chief_complaint}</div>
                    </div>
                  </div>
                  <Badge variant={enc.status as "recording" | "review" | "complete"}>
                    {sc?.label || enc.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Provider To-Do List */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-200">Provider To-Do List</h3>
            <p className="text-xs text-slate-500 mt-0.5">Persistent across all encounters</p>
          </CardHeader>
          <div className="px-5 pb-2 border-b border-slate-700/30">
            <div className="flex gap-2">
              <Input
                placeholder="Add to-do..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProviderTodo()}
                className="flex-1"
              />
              <Button size="sm" onClick={addProviderTodo}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <CardContent className="flex flex-col gap-1.5 max-h-[280px] overflow-auto">
            {pendingTodos.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleProviderTodo(t.id, t.done)}
                className="stagger-item flex items-center gap-2.5 p-2.5 rounded-md border border-slate-700/30 cursor-pointer hover:bg-slate-700/30"
              >
                <div className="w-4.5 h-4.5 rounded border-2 border-slate-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200">{t.text}</div>
                  <div className="text-xs text-slate-500">{t.encounter_label}</div>
                </div>
              </div>
            ))}
            {doneTodos.length > 0 && (
              <div className="text-xs text-slate-500 px-1 pt-2 font-medium">
                Completed ({doneTodos.length})
              </div>
            )}
            {doneTodos.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleProviderTodo(t.id, t.done)}
                className="stagger-item flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer opacity-60"
              >
                <div className="w-4.5 h-4.5 rounded bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm line-through text-slate-500">{t.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Orders */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Outstanding Orders & Tasks</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pending items from all encounters &mdash; {encounterTodos.length} remaining
          </p>
        </CardHeader>
        <CardContent>
          {encounterTodos.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No outstanding orders</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {encounterTodos.map((t) => {
                const cc = categoryConfig[t.category];
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleEncounterTodo(t.id, t.done)}
                    className="stagger-item flex items-center gap-2.5 p-3 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-700/30"
                  >
                    <div className="w-4.5 h-4.5 rounded border-2 border-slate-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-slate-200">{t.text}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cc?.bg || "bg-slate-800/50"} ${cc?.text || "text-slate-400"}`}
                        >
                          {t.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{t.patient_name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
