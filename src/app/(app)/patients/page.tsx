"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import PatientSearch from "@/components/patients/PatientSearch";
import type { PatientResult } from "@/components/patients/PatientSearch";
import PatientSummary from "@/components/patients/PatientSummary";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { fmtDate } from "@/lib/utils";
import type { Encounter } from "@/types";
import { User, Plus, Users } from "lucide-react";

export default function PatientsPage() {
  const { provider } = useProvider();
  const router = useRouter();
  const supabase = createClient();

  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [recentPatients, setRecentPatients] = useState<PatientResult[]>([]);

  const fetchRecentPatients = useCallback(async () => {
    if (!provider) return;

    const { data } = await supabase
      .from("encounters")
      .select("patient_name, patient_id, date_of_service")
      .eq("provider_id", provider.id)
      .order("date_of_service", { ascending: false })
      .limit(50);

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
      setRecentPatients(Array.from(grouped.values()).slice(0, 10));
    }
  }, [provider, supabase]);

  useEffect(() => {
    fetchRecentPatients();
  }, [fetchRecentPatients]);

  const handleCreateNew = (data: { name: string; mrn: string; chiefComplaint: string }) => {
    const params = new URLSearchParams();
    params.set("name", data.name);
    if (data.mrn) params.set("mrn", data.mrn);
    if (data.chiefComplaint) params.set("cc", data.chiefComplaint);
    router.push(`/encounters/new?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-slate-400 text-sm mt-0.5">Search and view patient histories</p>
        </div>
        <Button onClick={() => router.push("/encounters/new")}>
          <Plus className="w-4 h-4" /> New Encounter
        </Button>
      </div>

      {/* Patient Search */}
      <PatientSearch
        onSelectPatient={setSelectedPatient}
        onCreateNew={handleCreateNew}
        showSummaryOnSelect
      />

      {/* Patient Summary */}
      {selectedPatient && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">{selectedPatient.patient_name}</h2>
            {selectedPatient.patient_id && (
              <span className="text-xs text-slate-500">MRN: {selectedPatient.patient_id}</span>
            )}
          </div>
          <PatientSummary patient={selectedPatient} />
        </div>
      )}

      {/* Recent Patients */}
      {!selectedPatient && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Recent Patients</h2>
          </div>
          {recentPatients.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No patients yet</p>
                <p className="text-xs mt-1">Create an encounter to get started</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recentPatients.map((patient, i) => (
                <Card
                  key={`${patient.patient_name}__${patient.patient_id}__${i}`}
                  className="stagger-item cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <button
                    className="w-full text-left p-4 flex items-center gap-3"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200">{patient.patient_name}</div>
                      <div className="text-xs text-slate-500">
                        {patient.patient_id && `MRN: ${patient.patient_id} · `}
                        {patient.encounter_count} visit{patient.encounter_count !== 1 ? "s" : ""} · Last: {fmtDate(patient.last_visit)}
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
