"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check, Edit3, Save, X, Copy, FileSignature } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface NoteSection {
  sectionId: string;
  title: string;
  content: string;
}

interface NoteEditorProps {
  noteId: Id<"notes">;
  sections: NoteSection[];
  status: string;
  fullText: string;
}

export function NoteEditor({ noteId, sections, status, fullText }: NoteEditorProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);

  const updateSection = useMutation(api.notes.updateSection);
  const updateStatus = useMutation(api.notes.updateStatus);

  const handleEdit = (section: NoteSection) => {
    setEditingSectionId(section.sectionId);
    setEditContent(section.content);
  };

  const handleSave = async () => {
    if (editingSectionId) {
      await updateSection({
        id: noteId,
        sectionId: editingSectionId,
        content: editContent,
      });
      setEditingSectionId(null);
      setEditContent("");
    }
  };

  const handleCancel = () => {
    setEditingSectionId(null);
    setEditContent("");
  };

  const handleSign = async () => {
    await updateStatus({ id: noteId, status: "signed" });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Badge
          variant={
            status === "signed"
              ? "success"
              : status === "draft"
                ? "warning"
                : "outline"
          }
        >
          {status === "signed"
            ? "Signed"
            : status === "draft"
              ? "Draft"
              : status === "reviewed"
                ? "Reviewed"
                : status}
        </Badge>
        <div className="flex-1" />
        <Button variant="outline" onClick={handleCopy} className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Note
            </>
          )}
        </Button>
        {status !== "signed" && (
          <Button onClick={handleSign} className="gap-2">
            <FileSignature className="h-4 w-4" />
            Sign Note
          </Button>
        )}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.sectionId}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{section.title}</CardTitle>
              {editingSectionId !== section.sectionId && status !== "signed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(section)}
                  className="gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingSectionId === section.sectionId ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="gap-1">
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap">{section.content}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
