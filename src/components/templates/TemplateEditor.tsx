"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  Save,
  X,
  Info,
} from "lucide-react";
import { cn, sectionFormatLabels } from "@/lib/utils";
import type { Template, TemplateSection } from "@/types";

const FORMAT_OPTIONS = [
  { value: "paragraph", label: "Paragraph, Standard" },
  { value: "bullet", label: "Bullet, Standard" },
  { value: "custom-ros", label: "Custom ROS" },
  { value: "bluf-ap", label: "BLUF Assessment & Plan" },
  { value: "orders", label: "Orders" },
];

const GROUP_OPTIONS = ["Subjective", "Objective", "Assessment & Plan", "Orders", "Narrative"];

// Section row
function SectionRow({
  section,
  onUpdate,
  onDelete,
  onToggleExpand,
  isExpanded,
}: {
  section: TemplateSection;
  onUpdate: (updates: Partial<TemplateSection>) => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}) {
  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden mb-2 transition-colors hover:border-slate-600/50">
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={onToggleExpand}
      >
        <GripVertical className="w-4 h-4 text-slate-500 cursor-grab flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {isExpanded ? (
            <input
              className="w-full text-sm font-medium text-slate-200 border-0 border-b border-slate-600 focus:border-blue-500 focus:outline-none bg-transparent py-0.5"
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="Section title"
            />
          ) : (
            <span className="text-sm font-medium text-slate-200">{section.title}</span>
          )}
          {!isExpanded && section.instructions && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{section.instructions}</p>
          )}
        </div>
        <select
          className="text-xs text-slate-400 bg-transparent border-0 focus:outline-none cursor-pointer pr-6"
          value={section.format}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate({ format: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {FORMAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-slate-500 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
        )}
      </div>

      {/* Expanded: AI instructions editor */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 bg-slate-800/50 border-t border-slate-700/50">
          <div className="mb-2">
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Custom AI Instructions
            </label>
            <div className="flex items-start gap-2 mb-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
              <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300 leading-relaxed">
                <strong>[Square brackets]</strong> = Content placeholders (AI fills these in)<br />
                <strong>(Parentheses)</strong> = Instructions for how AI should handle content<br />
                <strong>&quot;Quotation marks&quot;</strong> = Verbatim text that appears exactly as written
              </div>
            </div>
            <textarea
              className="w-full text-sm border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y min-h-[80px] font-mono bg-slate-900/50 text-slate-200 placeholder:text-slate-500"
              value={section.instructions}
              onChange={(e) => onUpdate({ instructions: e.target.value })}
              placeholder='e.g., [Mention any allergies the patient has] (Only include if explicitly mentioned) "Appropriate mood and affect."'
              rows={4}
            />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Group</label>
              <select
                className="text-sm border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-900/50 text-slate-200"
                value={section.group}
                onChange={(e) => onUpdate({ group: e.target.value })}
              >
                {GROUP_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main template editor component
export default function TemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template?: Template;
  onSave: (data: { name: string; description: string; category: string; sections: TemplateSection[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "custom");
  const [sections, setSections] = useState<TemplateSection[]>(
    template?.sections || [
      { id: "s1", group: "Subjective", title: "History of Present Illness", format: "paragraph", order: 0, instructions: "" },
      { id: "s2", group: "Objective", title: "Physical Examination", format: "paragraph", order: 1, instructions: "" },
      { id: "s3", group: "Assessment & Plan", title: "Assessment & Plan", format: "bluf-ap", order: 2, instructions: "" },
    ]
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateSection = (id: string, updates: Partial<TemplateSection>) => {
    setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSection = (id: string) => {
    setSections((ss) => ss.filter((s) => s.id !== id));
  };

  const addSection = (group: string) => {
    const newId = `s${Date.now()}`;
    const maxOrder = Math.max(0, ...sections.filter((s) => s.group === group).map((s) => s.order));
    const newSection: TemplateSection = {
      id: newId,
      group,
      title: "Custom Subsection",
      format: "paragraph",
      order: maxOrder + 1,
      instructions: "",
    };
    setSections([...sections, newSection]);
    setExpandedId(newId);
  };

  // Group sections for display
  const groups = sections.reduce<Record<string, TemplateSection[]>>((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});

  const groupOrder = ["Subjective", "Objective", "Assessment & Plan", "Orders", "Narrative"];
  const sortedGroups = groupOrder.filter((g) => groups[g]?.length > 0);
  // Include any groups not in groupOrder
  Object.keys(groups).forEach((g) => { if (!sortedGroups.includes(g)) sortedGroups.push(g); });

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {template && <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-5 h-5" /></button>}
          <input
            className="text-lg font-bold text-white border-0 focus:outline-none bg-transparent placeholder:text-slate-600"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template Name"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, description, category, sections })}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-blue-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 py-3 border-b border-slate-700/30 bg-slate-900/30">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 block mb-1">Description</label>
            <input
              className="w-full text-sm border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-800/50 text-slate-200 placeholder:text-slate-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this template"
            />
          </div>
          <div className="w-48">
            <label className="text-xs font-medium text-slate-400 block mb-1">Category</label>
            <select
              className="w-full text-sm border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-800/50 text-slate-200"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="soap">SOAP</option>
              <option value="hp">H&P</option>
              <option value="progress">Progress Note</option>
              <option value="custom">Custom</option>
              <option value="doxgpt">DoxGPT / VA Narrative</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-5 py-2 border-b border-slate-700/30">
        <p className="text-xs text-slate-500">
          Customize notes with subsections. Templates will appear in the template selector on encounters.
        </p>
      </div>

      {/* Sections grouped by category */}
      <div className="px-5 py-4">
        {sortedGroups.map((group) => (
          <div key={group} className="mb-6">
            <h3 className="text-sm font-bold text-slate-200 mb-3">{group}</h3>
            {(groups[group] || [])
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  onUpdate={(updates) => updateSection(section.id, updates)}
                  onDelete={() => deleteSection(section.id)}
                  onToggleExpand={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  isExpanded={expandedId === section.id}
                />
              ))}
            <button
              onClick={() => addSection(group)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 mt-1 transition-colors"
            >
              New subsection <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add new group */}
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <button
            onClick={() => {
              const group = prompt("Group name (e.g., Subjective, Objective, Assessment & Plan):");
              if (group) addSection(group);
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add new section group
          </button>
        </div>
      </div>
    </div>
  );
}
