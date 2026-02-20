"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Search, Plus, User, X } from "lucide-react";
import type { Encounter } from "@/types";

export interface PatientResult {
  patient_name: string;
  patient_id: string | null;
  encounter_count: number;
  last_visit: string;
}

interface PatientSearchProps {
  onSelectPatient?: (patient: PatientResult) => void;
  onCreateNew?: (data: { name: string; mrn: string; chiefComplaint: string }) => void;
  showSummaryOnSelect?: boolean;
  className?: string;
}

export default function PatientSearch({
  onSelectPatient,
  onCreateNew,
  showSummaryOnSelect = false,
  className,
}: PatientSearchProps) {
  const { provider } = useProvider();
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMrn, setNewMrn] = useState("");
  const [newCC, setNewCC] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchPatients = useCallback(
    async (searchQuery: string) => {
      if (!provider || searchQuery.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      const term = `%${searchQuery.trim()}%`;

      const { data } = await supabase
        .from("encounters")
        .select("patient_name, patient_id, date_of_service")
        .eq("provider_id", provider.id)
        .or(`patient_name.ilike.${term},patient_id.ilike.${term}`)
        .order("date_of_service", { ascending: false });

      if (data) {
        const grouped = new Map<string, PatientResult>();
        for (const enc of data as Pick<Encounter, "patient_name" | "patient_id" | "date_of_service">[]) {
          const key = `${enc.patient_name}__${enc.patient_id || ""}`;
          const existing = grouped.get(key);
          if (existing) {
            existing.encounter_count++;
          } else {
            grouped.set(key, {
              patient_name: enc.patient_name,
              patient_id: enc.patient_id,
              encounter_count: 1,
              last_visit: enc.date_of_service,
            });
          }
        }
        setResults(Array.from(grouped.values()));
        setShowDropdown(true);
      }
      setLoading(false);
    },
    [provider, supabase]
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedPatient(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPatients(value), 300);
  };

  const handleSelect = (patient: PatientResult) => {
    setSelectedPatient(patient);
    setQuery(patient.patient_name);
    setShowDropdown(false);
    onSelectPatient?.(patient);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedPatient(null);
    setResults([]);
    setShowDropdown(false);
  };

  const handleCreateNew = () => {
    if (!newName.trim()) return;
    onCreateNew?.({ name: newName.trim(), mrn: newMrn.trim(), chiefComplaint: newCC.trim() });
    setShowNewForm(false);
    setNewName("");
    setNewMrn("");
    setNewCC("");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Search patients by name or MRN..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && !selectedPatient) setShowDropdown(true);
          }}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute z-40 w-full mt-1 rounded-lg border border-slate-700/50 bg-slate-800 shadow-xl animate-scale-in overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="p-3">
              <p className="text-sm text-slate-500 mb-2">No patients found</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewForm(true);
                  setShowDropdown(false);
                  setNewName(query.trim());
                }}
                className="w-full"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Patient
              </Button>
            </div>
          )}
          {!loading &&
            results.map((patient, i) => (
              <button
                key={`${patient.patient_name}__${patient.patient_id}__${i}`}
                onClick={() => handleSelect(patient)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors flex items-center gap-3 border-b border-slate-700/30 last:border-b-0"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">{patient.patient_name}</div>
                  <div className="text-xs text-slate-500">
                    {patient.patient_id && `MRN: ${patient.patient_id} · `}
                    {patient.encounter_count} visit{patient.encounter_count !== 1 ? "s" : ""}
                  </div>
                </div>
              </button>
            ))}
          {!loading && results.length > 0 && (
            <div className="p-2 border-t border-slate-700/30">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNewForm(true);
                  setShowDropdown(false);
                  setNewName(query.trim());
                }}
                className="w-full text-xs"
              >
                <Plus className="w-3 h-3" /> Add New Patient
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New Patient Form */}
      {showNewForm && (
        <Card className="mt-2 animate-scale-in">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-200">New Patient</h4>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Patient Name</label>
              <Input
                placeholder="e.g., SGT Rodriguez"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">MRN / Patient ID</label>
              <Input
                placeholder="e.g., MRN-4261"
                value={newMrn}
                onChange={(e) => setNewMrn(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Chief Complaint</label>
              <Input
                placeholder="e.g., TBI follow-up"
                value={newCC}
                onChange={(e) => setNewCC(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleCreateNew} disabled={!newName.trim()}>
                <Plus className="w-3.5 h-3.5" /> Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Selected Patient Indicator */}
      {selectedPatient && showSummaryOnSelect && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-fade-in">
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">{selectedPatient.patient_name}</span>
          {selectedPatient.patient_id && (
            <span className="text-xs text-blue-400/60">MRN: {selectedPatient.patient_id}</span>
          )}
          <span className="text-xs text-blue-400/60 ml-auto">
            {selectedPatient.encounter_count} visit{selectedPatient.encounter_count !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
