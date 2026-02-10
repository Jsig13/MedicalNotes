import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "recording":
      return "text-red-500 bg-red-50";
    case "transcribing":
      return "text-yellow-500 bg-yellow-50";
    case "generating":
      return "text-blue-500 bg-blue-50";
    case "review":
      return "text-purple-500 bg-purple-50";
    case "complete":
      return "text-green-500 bg-green-50";
    default:
      return "text-gray-500 bg-gray-50";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "recording":
      return "Recording";
    case "transcribing":
      return "Transcribing";
    case "generating":
      return "Generating Note";
    case "review":
      return "Ready for Review";
    case "complete":
      return "Complete";
    default:
      return status;
  }
}
