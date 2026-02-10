"use client";

import { Badge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils";
import type { TranscriptEntry } from "./VoiceRecorder";
import { User, Stethoscope } from "lucide-react";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
  showTimestamps?: boolean;
}

export function TranscriptView({
  entries,
  showTimestamps = true,
}: TranscriptViewProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>No transcript yet. Start recording to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex gap-3 p-3 rounded-lg ${
            entry.speaker === "provider"
              ? "bg-blue-50 border-l-4 border-blue-400"
              : "bg-green-50 border-l-4 border-green-400"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {entry.speaker === "provider" ? (
              <Stethoscope className="h-4 w-4 text-blue-500" />
            ) : (
              <User className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={entry.speaker === "provider" ? "default" : "success"}
                className="text-xs"
              >
                {entry.speaker === "provider" ? "Provider" : "Patient"}
              </Badge>
              {showTimestamps && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDuration(entry.startTime)} -{" "}
                  {formatDuration(entry.endTime)}
                </span>
              )}
              {!entry.isFinal && (
                <span className="text-xs italic text-[var(--muted-foreground)]">
                  (listening...)
                </span>
              )}
            </div>
            <p className="text-sm">{entry.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
