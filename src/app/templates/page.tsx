"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface SectionDraft {
  id: string;
  title: string;
  description: string;
  placeholder: string;
  required: boolean;
  order: number;
}

export default function TemplatesPage() {
  const templates = useQuery(api.templates.list);
  const createTemplate = useMutation(api.templates.create);
  const removeTemplate = useMutation(api.templates.remove);

  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [sections, setSections] = useState<SectionDraft[]>([]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `section_${Date.now()}`,
        title: "",
        description: "",
        placeholder: "",
        required: true,
        order: sections.length,
      },
    ]);
  };

  const updateSection = (index: number, updates: Partial<SectionDraft>) => {
    setSections(
      sections.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const handleCreate = async () => {
    if (!name.trim() || sections.length === 0) return;

    await createTemplate({
      name: name.trim(),
      description: description.trim(),
      category,
      sections: sections.map((s) => ({
        ...s,
        id: s.id || s.title.toLowerCase().replace(/\s+/g, "_"),
      })),
      isDefault: false,
    });

    setName("");
    setDescription("");
    setCategory("custom");
    setSections([]);
    setShowCreate(false);
  };

  const handleDelete = async (id: Id<"templates">) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await removeTemplate({ id });
    }
  };

  const categoryLabels: Record<string, string> = {
    soap: "SOAP Note",
    hp: "History & Physical",
    progress: "Progress Note",
    procedure: "Procedure Note",
    custom: "Custom",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Note Templates</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage templates for generating clinical notes
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Create Template Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Template</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreate(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Template Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Dermatology Follow-up"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Category
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="soap">SOAP Note</option>
                  <option value="hp">History & Physical</option>
                  <option value="progress">Progress Note</option>
                  <option value="procedure">Procedure Note</option>
                  <option value="custom">Custom</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
              />
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Sections</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="p-3 border border-[var(--border)] rounded-lg space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(index, { title: e.target.value })
                        }
                        placeholder="Section title"
                        className="flex-1"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={section.required}
                          onChange={(e) =>
                            updateSection(index, {
                              required: e.target.checked,
                            })
                          }
                        />
                        Required
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(index)}
                      >
                        <Trash2 className="h-3 w-3 text-[var(--destructive)]" />
                      </Button>
                    </div>
                    <Input
                      value={section.description}
                      onChange={(e) =>
                        updateSection(index, { description: e.target.value })
                      }
                      placeholder="What should be documented in this section?"
                    />
                    <Textarea
                      value={section.placeholder}
                      onChange={(e) =>
                        updateSection(index, { placeholder: e.target.value })
                      }
                      placeholder="Guidance text for AI note generation..."
                      rows={2}
                    />
                  </div>
                ))}
                {sections.length === 0 && (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                    Add sections to define your note template structure.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || sections.length === 0}
              >
                Create Template
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="space-y-3">
        {templates?.map((template) => (
          <Card key={template._id}>
            <CardContent className="p-4">
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(
                    expandedId === template._id ? null : template._id
                  )
                }
              >
                {expandedId === template._id ? (
                  <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                )}
                <FileText className="h-5 w-5 text-[var(--primary)]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="outline">
                      {categoryLabels[template.category] || template.category}
                    </Badge>
                    {template.isDefault && (
                      <Badge variant="default">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {template.description} · {template.sections.length} sections
                  </p>
                </div>
                {!template.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                  </Button>
                )}
              </div>

              {expandedId === template._id && (
                <div className="mt-4 ml-12 space-y-2">
                  {template.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div
                        key={section.id}
                        className="p-3 rounded-lg bg-[var(--muted)]"
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {section.title}
                          </p>
                          {section.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          {section.description}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
