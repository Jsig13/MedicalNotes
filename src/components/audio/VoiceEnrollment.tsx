"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AudioRecorder, blobToBase64 } from "@/lib/speech";
import { Mic, MicOff, Check, RotateCcw, Trash2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDuration } from "@/lib/utils";

interface VoiceEnrollmentProps {
  providerId: Id<"providers">;
}

const ENROLLMENT_PHRASES = [
  "The patient presents with complaints of chronic lower back pain radiating to the left leg",
  "Review of systems is negative for fever, chills, weight loss, or night sweats",
  "Assessment and plan: Continue current medications, follow up in two weeks",
  "Past medical history is significant for hypertension, diabetes mellitus type 2, and hyperlipidemia",
  "Physical examination reveals bilateral breath sounds clear to auscultation",
];

export function VoiceEnrollment({ providerId }: VoiceEnrollmentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recorder] = useState(() => new AudioRecorder());

  const createProfile = useMutation(api.voiceProfiles.create);
  const addSample = useMutation(api.voiceProfiles.addSample);
  const resetProfile = useMutation(api.voiceProfiles.resetProfile);
  const voiceProfile = useQuery(api.voiceProfiles.getByProvider, { providerId });

  const startRecording = useCallback(async () => {
    // Ensure profile exists
    let profileId = voiceProfile?._id;
    if (!profileId) {
      profileId = await createProfile({ providerId });
    }

    setIsRecording(true);
    setRecordingDuration(0);
    await recorder.start();

    // Track duration
    const interval = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);

    // Auto-stop after 15 seconds
    setTimeout(async () => {
      clearInterval(interval);
      if (recorder.isRecording()) {
        const blob = await recorder.stop();
        const base64 = await blobToBase64(blob);
        await addSample({
          profileId: profileId!,
          audioData: base64,
          duration: recordingDuration,
        });
        setIsRecording(false);
        setCurrentPhraseIndex((i) => Math.min(i + 1, ENROLLMENT_PHRASES.length - 1));
      }
    }, 15000);
  }, [voiceProfile, createProfile, providerId, recorder, addSample, recordingDuration]);

  const stopRecording = useCallback(async () => {
    const blob = await recorder.stop();
    const base64 = await blobToBase64(blob);

    let profileId = voiceProfile?._id;
    if (!profileId) {
      profileId = await createProfile({ providerId });
    }

    await addSample({
      profileId,
      audioData: base64,
      duration: recordingDuration,
    });
    setIsRecording(false);
    setCurrentPhraseIndex((i) => Math.min(i + 1, ENROLLMENT_PHRASES.length - 1));
  }, [recorder, voiceProfile, createProfile, providerId, addSample, recordingDuration]);

  const handleReset = useCallback(async () => {
    if (voiceProfile?._id) {
      await resetProfile({ profileId: voiceProfile._id });
      setCurrentPhraseIndex(0);
    }
  }, [voiceProfile, resetProfile]);

  const sampleCount = voiceProfile?.sampleCount ?? 0;
  const isEnrolled = voiceProfile?.enrollmentComplete ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Voice Enrollment</CardTitle>
            <CardDescription>
              Record your voice so the system can identify you during encounters
            </CardDescription>
          </div>
          <Badge variant={isEnrolled ? "success" : "warning"}>
            {isEnrolled ? "Enrolled" : `${sampleCount}/3 Samples`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnrolled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">
                Voice enrollment complete! The system will use your voice profile
                to identify you as the provider during encounters.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Re-enroll Voice
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--muted)]">
              <p className="text-sm font-medium mb-2">
                Sample {Math.min(sampleCount + 1, 3)} of 3 — Read the following phrase:
              </p>
              <p className="text-lg italic text-[var(--primary)]">
                &ldquo;{ENROLLMENT_PHRASES[currentPhraseIndex]}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} size="lg" className="gap-2">
                  <Mic className="h-5 w-5" />
                  Record Sample
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                >
                  <MicOff className="h-5 w-5" />
                  Stop Recording ({formatDuration(recordingDuration)})
                </Button>
              )}

              {sampleCount > 0 && !isRecording && (
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="gap-2 text-[var(--destructive)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Start Over
                </Button>
              )}
            </div>

            {/* Progress indicator */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < sampleCount
                      ? "bg-[var(--primary)]"
                      : i === sampleCount && isRecording
                        ? "bg-[var(--primary)] animate-pulse"
                        : "bg-[var(--muted)]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
