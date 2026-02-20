import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

export function fmtTime(date: string | Date) {
  return format(new Date(date), "h:mm a");
}

export function fmtDateTime(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  recording: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Recording" },
  scrubbing: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Scrubbing" },
  generating: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Generating" },
  review: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", label: "Ready for Review" },
  complete: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", label: "Complete" },
};

export const categoryConfig: Record<string, { bg: string; text: string }> = {
  imaging: { bg: "bg-blue-500/10", text: "text-blue-400" },
  referral: { bg: "bg-purple-500/10", text: "text-purple-400" },
  rx: { bg: "bg-red-500/10", text: "text-red-400" },
  lab: { bg: "bg-amber-500/10", text: "text-amber-400" },
  followup: { bg: "bg-green-500/10", text: "text-green-400" },
  general: { bg: "bg-slate-500/10", text: "text-slate-400" },
};

export const sectionFormatLabels: Record<string, string> = {
  paragraph: "Paragraph, Standard",
  bullet: "Bullet, Standard",
  "custom-ros": "Custom ROS",
  "bluf-ap": "BLUF Assessment & Plan",
  orders: "Orders",
};
