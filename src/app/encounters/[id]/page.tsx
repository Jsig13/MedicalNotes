"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { VoiceRecorder, type TranscriptEntry } from "@/components/audio/VoiceRecorder";
import { TranscriptView } from "@/components/audio/TranscriptView";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  formatDateTime,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function EncounterDetailPage() {
  const params = useParams();
  const encounterId = params.id as Id<"encounters">;

  const [providerId, setProviderId] = useState<Id<"providers"> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const getOrCreate = useMutation(api.providers.getOrCreate);
  const addBatchSegments = useMutation(api.transcripts.addBatchSegments);
  const updateEncounterStatus = useMutation(api.encounters.updateStatus);
  const updateEncounter = useMutation(api.encounters.update);
  const generateNote = useAction(api.notes.generateFromTranscript);

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

  const encounter = useQuery(api.encounters.get, { id: encounterId });
  const transcriptSegments = useQuery(api.transcripts.getByEncounter, {
    encounterId,
  });
  const note = useQuery(api.notes.getByEncounter, { encounterId });
  const templates = useQuery(api.templates.list);
  const dictionary = useQuery(
    api.dictionary.listByProvider,
    providerId ? { providerId } : "skip"
  );
  const voiceProfile = useQuery(
    api.voiceProfiles.getByProvider,
    providerId ? { providerId } : "skip"
  );

  // Hydrate transcript entries from DB
  useEffect(() => {
    if (transcriptSegments && transcriptSegments.length > 0 && transcriptEntries.length === 0) {
      setTranscriptEntries(
        transcriptSegments.map((s) => ({
          speaker: s.speaker as "provider" | "patient",
          text: s.text,
          startTime: s.startTime,
          endTime: s.endTime,
          isFinal: true,
        }))
      );
    }
  }, [transcriptSegments, transcriptEntries.length]);

  const handleTranscriptUpdate = useCallback(
    (entries: TranscriptEntry[]) => {
      setTranscriptEntries(entries);
    },
    []
  );

  const handleRecordingComplete = useCallback(
    async (_audioBase64: string, _duration: number) => {
      // Save all transcript entries to the database
      if (transcriptEntries.length > 0) {
        await addBatchSegments({
          segments: transcriptEntries
            .filter((e) => e.isFinal)
            .map((e, i) => ({
              encounterId,
              speaker: e.speaker,
              speakerName:
                e.speaker === "provider" ? "Dr. Provider" : "Patient",
              text: e.text,
              startTime: e.startTime,
              endTime: e.endTime,
              confidence: 0.9,
              order: i,
            })),
        });
      }

      await updateEncounterStatus({
        id: encounterId,
        status: "transcribing",
      });

      // Auto-transition to ready for note generation
      setTimeout(async () => {
        await updateEncounterStatus({
          id: encounterId,
          status: "review",
        });
      }, 1000);
    },
    [transcriptEntries, addBatchSegments, encounterId, updateEncounterStatus]
  );

  const handleGenerateNote = useCallback(async () => {
    if (!providerId) return;

    const templateId = (selectedTemplateId || encounter?.templateId) as Id<"templates"> | undefined;
    if (!templateId) {
      alert("Please select a template first.");
      return;
    }

    // Update template on encounter if changed
    if (selectedTemplateId && selectedTemplateId !== encounter?.templateId) {
      await updateEncounter({
        id: encounterId,
        templateId: selectedTemplateId as Id<"templates">,
      });
    }

    setIsGenerating(true);
    await updateEncounterStatus({
      id: encounterId,
      status: "generating",
    });

    try {
      await generateNote({
        encounterId,
        templateId: templateId as Id<"templates">,
        providerId,
      });
    } catch (error) {
      console.error("Note generation failed:", error);
      await updateEncounterStatus({
        id: encounterId,
        status: "review",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    providerId,
    selectedTemplateId,
    encounter?.templateId,
    encounterId,
    updateEncounter,
    updateEncounterStatus,
    generateNote,
  ]);

  const handleMarkComplete = useCallback(async () => {
    await updateEncounterStatus({
      id: encounterId,
      status: "complete",
    });
  }, [encounterId, updateEncounterStatus]);

  if (!encounter) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  const dictionaryEntries = (dictionary ?? []).map((d) => ({
    term: d.term,
    alternatives: d.alternatives,
  }));

  const currentTemplateId = selectedTemplateId || encounter.templateId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/encounters">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{encounter.patientName}</h1>
            <Badge
              className={getStatusColor(encounter.status)}
              variant="outline"
            >
              {getStatusLabel(encounter.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(encounter.dateOfService)}
            </span>
            {encounter.chiefComplaint && (
              <span>CC: {encounter.chiefComplaint}</span>
            )}
            {encounter.patientId && (
              <span>MRN: {encounter.patientId}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recording & Transcript */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recording & Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(encounter.status === "recording" || transcriptEntries.length === 0) && (
                <VoiceRecorder
                  onTranscriptUpdate={handleTranscriptUpdate}
                  onRecordingComplete={handleRecordingComplete}
                  dictionary={dictionaryEntries}
                  providerVoiceEnrolled={voiceProfile?.enrollmentComplete ?? false}
                  isActive={isRecording}
                  onToggle={() => setIsRecording(!isRecording)}
                />
              )}

              <div className="max-h-[500px] overflow-y-auto">
                <TranscriptView entries={transcriptEntries} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Note Generation & Editor */}
        <div className="space-y-4">
          {/* Template Selection & Generate */}
          {!note && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Note Template
                  </label>
                  <Select
                    value={currentTemplateId || ""}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    <option value="">Select a template...</option>
                    {templates?.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateNote}
                  disabled={
                    isGenerating ||
                    !currentTemplateId ||
                    transcriptEntries.length === 0
                  }
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Note...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Note from Transcript
                    </>
                  )}
                </Button>
                {transcriptEntries.length === 0 && (
                  <p className="text-sm text-[var(--muted-foreground)] text-center">
                    Record a conversation first, then generate a note.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Note Editor */}
          {note && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Clinical Note</CardTitle>
                  {encounter.status !== "complete" && (
                    <Button size="sm" onClick={handleMarkComplete}>
                      Mark Complete
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <NoteEditor
                  noteId={note._id}
                  sections={note.sections}
                  status={note.status}
                  fullText={note.fullText}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
