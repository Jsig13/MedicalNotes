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
  recording: { bg: "bg-red-50", text: "text-red-500", border: "border-red-200", label: "Recording" },
  scrubbing: { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-200", label: "Scrubbing" },
  generating: { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200", label: "Generating" },
  review: { bg: "bg-purple-50", text: "text-purple-500", border: "border-purple-200", label: "Ready for Review" },
  complete: { bg: "bg-green-50", text: "text-green-500", border: "border-green-200", label: "Complete" },
};

export const categoryConfig: Record<string, { bg: string; text: string }> = {
  imaging: { bg: "bg-blue-50", text: "text-blue-600" },
  referral: { bg: "bg-purple-50", text: "text-purple-600" },
  rx: { bg: "bg-red-50", text: "text-red-600" },
  lab: { bg: "bg-amber-50", text: "text-amber-600" },
  followup: { bg: "bg-green-50", text: "text-green-600" },
  general: { bg: "bg-slate-100", text: "text-slate-600" },
};

export const sectionFormatLabels: Record<string, string> = {
  paragraph: "Paragraph, Standard",
  bullet: "Bullet, Standard",
  "custom-ros": "Custom ROS",
  "bluf-ap": "BLUF Assessment & Plan",
  orders: "Orders",
};
