"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Plus, Stethoscope, Search, X } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

export default function EncountersPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <EncountersContent />
    </Suspense>
  );
}

function EncountersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showNew = searchParams.get("new") === "true";

  const [providerId, setProviderId] = useState<Id<"providers"> | null>(null);
  const [showNewForm, setShowNewForm] = useState(showNew);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const getOrCreate = useMutation(api.providers.getOrCreate);
  const createEncounter = useMutation(api.encounters.create);

  useEffect(() => {
    async function init() {
      const id = await getOrCreate({
        name: "Dr. Provider",
        email: "provider@medscribe.local",
      });
      setProviderId(id);
    }
    init();
  }, [getOrCreate]);

  const encounters = useQuery(
    api.encounters.listByProvider,
    providerId ? { providerId } : "skip"
  );

  const templates = useQuery(api.templates.list);

  const filteredEncounters = encounters?.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!providerId || !patientName.trim()) return;

    const encounterId = await createEncounter({
      providerId,
      patientName: patientName.trim(),
      patientId: patientId.trim() || undefined,
      chiefComplaint: chiefComplaint.trim() || undefined,
      templateId: selectedTemplate
        ? (selectedTemplate as Id<"templates">)
        : undefined,
    });

    setPatientName("");
    setPatientId("");
    setChiefComplaint("");
    setSelectedTemplate("");
    setShowNewForm(false);
    router.push(`/encounters/${encounterId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Encounters</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage patient encounters and recordings
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Encounter
        </Button>
      </div>

      {/* New Encounter Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>New Encounter</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Patient Name *
                </label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Patient ID
                </label>
                <Input
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Optional MRN"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Chief Complaint
              </label>
              <Input
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g., Lower back pain for 2 weeks"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Note Template
              </label>
              <Select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Select a template...</option>
                {templates?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} — {t.description}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={!patientName.trim()}>
                Create & Start Recording
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search encounters..."
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <option value="all">All Statuses</option>
          <option value="recording">Recording</option>
          <option value="transcribing">Transcribing</option>
          <option value="generating">Generating</option>
          <option value="review">Ready for Review</option>
          <option value="complete">Complete</option>
        </Select>
      </div>

      {/* Encounters List */}
      <div className="space-y-3">
        {!filteredEncounters || filteredEncounters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3" />
              <p className="text-[var(--muted-foreground)]">
                {encounters?.length === 0
                  ? "No encounters yet. Create your first encounter to get started."
                  : "No encounters match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEncounters.map((encounter) => (
            <Link
              key={encounter._id}
              href={`/encounters/${encounter._id}`}
            >
              <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Stethoscope className="h-5 w-5 text-[var(--muted-foreground)]" />
                      <div>
                        <p className="font-medium">{encounter.patientName}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {encounter.chiefComplaint || "No chief complaint"}{" "}
                          {encounter.patientId && `· MRN: ${encounter.patientId}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {formatDateTime(encounter.dateOfService)}
                      </span>
                      <Badge
                        className={getStatusColor(encounter.status)}
                        variant="outline"
                      >
                        {getStatusLabel(encounter.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
