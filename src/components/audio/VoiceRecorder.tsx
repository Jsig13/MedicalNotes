"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Mic, MicOff, Square, Pause, Play } from "lucide-react";
import {
  createSpeechRecognition,
  isSpeechRecognitionAvailable,
  applyDictionaryCorrections,
  AudioRecorder,
  blobToBase64,
  type DictionaryEntry,
} from "@/lib/speech";
import { formatDuration } from "@/lib/utils";

export interface TranscriptEntry {
  speaker: "provider" | "patient" | "unknown";
  text: string;
  startTime: number;
  endTime: number;
  isFinal: boolean;
}

interface VoiceRecorderProps {
  onTranscriptUpdate: (entries: TranscriptEntry[]) => void;
  onRecordingComplete: (audioBase64: string, duration: number) => void;
  dictionary: DictionaryEntry[];
  providerVoiceEnrolled: boolean;
  isActive: boolean;
  onToggle: () => void;
}

export function VoiceRecorder({
  onTranscriptUpdate,
  onRecordingComplete,
  dictionary,
  isActive,
  onToggle,
}: VoiceRecorderProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<"provider" | "patient">("provider");
  const [interimText, setInterimText] = useState("");
  const [speechAvailable] = useState(isSpeechRecognitionAvailable());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const segmentStartRef = useRef(0);

  // Timer for recording duration
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  const startRecording = useCallback(async () => {
    if (!speechAvailable) return;

    transcriptRef.current = [];
    setDuration(0);
    startTimeRef.current = Date.now();
    segmentStartRef.current = 0;

    // Start audio recording
    await recorderRef.current.start();

    // Start speech recognition
    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalText) {
        const correctedText = applyDictionaryCorrections(finalText, dictionary);
        const now = (Date.now() - startTimeRef.current) / 1000;
        const entry: TranscriptEntry = {
          speaker: currentSpeaker,
          text: correctedText.trim(),
          startTime: segmentStartRef.current,
          endTime: now,
          isFinal: true,
        };
        segmentStartRef.current = now;
        transcriptRef.current = [...transcriptRef.current, entry];
        onTranscriptUpdate(transcriptRef.current);
        setInterimText("");
      }

      if (interim) {
        setInterimText(applyDictionaryCorrections(interim, dictionary));
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (isActive && !isPaused && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // May throw if already started
        }
      }
    };

    recognition.start();
    onToggle();
  }, [speechAvailable, dictionary, currentSpeaker, isActive, isPaused, onTranscriptUpdate, onToggle]);

  const stopRecording = useCallback(async () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop audio recording
    const audioBlob = await recorderRef.current.stop();
    const audioBase64 = await blobToBase64(audioBlob);

    onRecordingComplete(audioBase64, duration);
    onToggle();
    setInterimText("");
  }, [duration, onRecordingComplete, onToggle]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  const toggleSpeaker = useCallback(() => {
    setCurrentSpeaker((s) => (s === "provider" ? "patient" : "provider"));
  }, []);

  if (!speechAvailable) {
    return (
      <div className="p-6 text-center border border-[var(--border)] rounded-xl bg-yellow-50">
        <MicOff className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="font-medium">Speech Recognition Not Available</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Please use Chrome or Edge for voice dictation support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {!isActive ? (
          <Button onClick={startRecording} size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
            <Button
              onClick={togglePause}
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
          </>
        )}

        {/* Speaker Toggle */}
        <Button
          onClick={toggleSpeaker}
          variant="outline"
          size="lg"
          className="gap-2 ml-auto"
        >
          Speaking:
          <Badge
            variant={currentSpeaker === "provider" ? "default" : "success"}
          >
            {currentSpeaker === "provider" ? "Provider" : "Patient"}
          </Badge>
        </Button>

        {/* Duration & Status */}
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">
            {formatDuration(duration)}
          </p>
          {isActive && (
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`}
              />
              <span className="text-xs text-[var(--muted-foreground)]">
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interim Text */}
      {interimText && (
        <div className="px-4 py-2 rounded-lg bg-[var(--muted)] text-sm italic text-[var(--muted-foreground)]">
          {interimText}...
        </div>
      )}
    </div>
  );
}
