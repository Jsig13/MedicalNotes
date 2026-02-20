"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Button from "./Button";

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function CopyButton({ text, label = "Copy", size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant={copied ? "success" : "outline"}
      size={size}
      onClick={handleCopy}
    >
      {copied ? <><Check className="w-3.5 h-3.5 animate-check-pop" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </Button>
  );
}
