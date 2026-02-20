"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { statusConfig, fmtDateTime } from "@/lib/utils";
import type { Encounter } from "@/types";
import { Plus, Stethoscope, Search } from "lucide-react";

export default function EncountersPage() {
  const { provider } = useProvider();
  const router = useRouter();
  const supabase = createClient();

  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!provider) return;
    const fetchEncounters = async () => {
      const { data } = await supabase
        .from("encounters")
        .select("*")
        .eq("provider_id", provider.id)
        .order("date_of_service", { ascending: false });
      if (data) setEncounters(data);
    };
    fetchEncounters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const filtered = encounters.filter((e) => {
    const matchSearch =
      !search ||
      e.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      e.chief_complaint?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Encounters</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage patient encounters and recordings</p>
        </div>
        <Button onClick={() => router.push("/encounters/new")}>
          <Plus className="w-4 h-4" /> New Encounter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search encounters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select className="w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="recording">Recording</option>
          <option value="scrubbing">Scrubbing</option>
          <option value="generating">Generating</option>
          <option value="review">Ready for Review</option>
          <option value="complete">Complete</option>
        </Select>
      </div>

      {/* Encounter List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No encounters found</p>
            <p className="text-xs mt-1">Create a new encounter to get started</p>
          </div>
        )}
        {filtered.map((enc) => {
          const sc = statusConfig[enc.status];
          return (
            <Card
              key={enc.id}
              className="cursor-pointer hover:border-blue-400 transition-colors"
            >
              <div
                className="p-4 flex justify-between items-center"
                onClick={() => router.push(`/encounters/${enc.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-medium text-sm">{enc.patient_name}</div>
                    <div className="text-xs text-slate-500">
                      {enc.chief_complaint}
                      {enc.patient_id && ` · MRN: ${enc.patient_id}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{fmtDateTime(enc.date_of_service)}</span>
                  <Badge variant={enc.status as "recording" | "review" | "complete"}>
                    {sc?.label || enc.status}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
