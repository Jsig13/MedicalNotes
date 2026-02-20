"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { Template } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function NewEncounterPage() {
  const { provider } = useProvider();
  const router = useRouter();
  const supabase = createClient();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .order("is_default", { ascending: false });
      if (data) {
        setTemplates(data);
        const defaultTpl = data.find((t: Template) => t.is_default);
        if (defaultTpl) setTemplateId(defaultTpl.id);
        else if (data.length > 0) setTemplateId(data[0].id);
      }
    };
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    setError("");
    setLoading(true);

    const { data, error: insertError } = await supabase
      .from("encounters")
      .insert({
        provider_id: provider.id,
        template_id: templateId || null,
        patient_name: patientName.trim(),
        patient_id: patientId.trim() || null,
        chief_complaint: chiefComplaint.trim() || null,
        status: "recording",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (data) {
      router.push(`/encounters/${data.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Encounter</h1>
          <p className="text-sm text-slate-400 mt-0.5">Create a new patient encounter</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Encounter Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/30">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., SGT Rodriguez"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">
                MRN / Patient ID
              </label>
              <Input
                placeholder="e.g., MRN-4261"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">
                Chief Complaint
              </label>
              <Textarea
                placeholder="e.g., Pre-retirement records review — TBI"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">
                Note Template
              </label>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_default ? "(Default)" : ""}
                  </option>
                ))}
              </Select>
              {templateId && templates.find((t) => t.id === templateId)?.description && (
                <p className="text-xs text-slate-500 mt-1">
                  {templates.find((t) => t.id === templateId)?.description}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || !patientName.trim()}>
                {loading ? "Creating..." : "Create Encounter"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
