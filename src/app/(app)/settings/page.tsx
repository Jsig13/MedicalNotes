"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { DictionaryEntry } from "@/types";
import { User, BookOpen, Save, Plus, Trash2, Settings } from "lucide-react";

export default function SettingsPage() {
  const { provider, refresh } = useProvider();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [credentials, setCredentials] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [newWrong, setNewWrong] = useState("");
  const [newCorrect, setNewCorrect] = useState("");
  const [newCategory, setNewCategory] = useState<"medical" | "military" | "names" | "custom">("medical");
  const [dictFilter, setDictFilter] = useState("all");

  useEffect(() => {
    if (!provider) return;
    setName(provider.name);
    setSpecialty(provider.specialty);
    setCredentials(provider.credentials);

    const fetchDictionary = async () => {
      const { data } = await supabase
        .from("dictionary")
        .select("*")
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false });
      if (data) setDictionary(data);
    };
    fetchDictionary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleSaveProfile = async () => {
    if (!provider) return;
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase
      .from("providers")
      .update({ name, specialty, credentials })
      .eq("id", provider.id);
    setSaving(false);
    if (error) {
      setSaveMsg(`Error: ${error.message}`);
    } else {
      setSaveMsg("Profile saved");
      await refresh();
      setTimeout(() => setSaveMsg(""), 2000);
    }
  };

  const addDictEntry = async () => {
    if (!newWrong.trim() || !newCorrect.trim() || !provider) return;
    const { data } = await supabase
      .from("dictionary")
      .insert({
        provider_id: provider.id,
        wrong_text: newWrong.trim(),
        correct_text: newCorrect.trim(),
        category: newCategory,
        enabled: true,
      })
      .select()
      .single();
    if (data) {
      setDictionary([data, ...dictionary]);
      setNewWrong("");
      setNewCorrect("");
    }
  };

  const toggleDictEntry = async (id: string, enabled: boolean) => {
    setDictionary((ds) => ds.map((d) => (d.id === id ? { ...d, enabled: !enabled } : d)));
    await supabase.from("dictionary").update({ enabled: !enabled }).eq("id", id);
  };

  const deleteDictEntry = async (id: string) => {
    setDictionary((ds) => ds.filter((d) => d.id !== id));
    await supabase.from("dictionary").delete().eq("id", id);
  };

  const filteredDict = dictionary.filter(
    (d) => dictFilter === "all" || d.category === dictFilter
  );

  const categoryColors: Record<string, { bg: string; text: string }> = {
    medical: { bg: "bg-blue-500/10", text: "text-blue-400" },
    military: { bg: "bg-amber-500/10", text: "text-amber-400" },
    names: { bg: "bg-purple-500/10", text: "text-purple-400" },
    custom: { bg: "bg-slate-500/10", text: "text-slate-400" },
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Provider Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <h3 className="text-base font-semibold text-white">Provider Profile</h3>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Specialty</label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Credentials</label>
              <Select value={credentials} onChange={(e) => setCredentials(e.target.value)}>
                <option value="MD">MD</option>
                <option value="DO">DO</option>
                <option value="NP">NP</option>
                <option value="PA">PA</option>
                <option value="PA-C">PA-C</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.startsWith("Error") ? "text-red-500" : "text-green-400"}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <h3 className="text-base font-semibold text-white">AI Settings</h3>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-slate-300">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
            Scrub personal/non-clinical content from notes
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
            Auto-generate encounter to-do items from orders
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
            Build note live during recording
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-blue-500" />
            Use DoxGPT narrative format for A&P (retirement/VA notes)
          </label>
        </CardContent>
      </Card>

      {/* Dictionary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <div>
              <h3 className="text-base font-semibold text-white">
                Custom Dictionary ({dictionary.filter((d) => d.enabled).length} active)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Words that get misspelled in transcription
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Add term */}
        <div className="px-5 py-3 border-b border-slate-700/30 bg-slate-900/30">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              placeholder="Misspelled / Misheard (e.g., sea ram)"
              value={newWrong}
              onChange={(e) => setNewWrong(e.target.value)}
            />
            <Input
              placeholder="Correct Spelling (e.g., C-RAM)"
              value={newCorrect}
              onChange={(e) => setNewCorrect(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select
              className="w-40"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as "medical" | "military" | "names" | "custom")}
            >
              <option value="medical">Medical</option>
              <option value="military">Military</option>
              <option value="names">Names/Locations</option>
              <option value="custom">Custom</option>
            </Select>
            <Button size="sm" onClick={addDictEntry}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-5 py-2 border-b border-slate-700/30 flex gap-1.5">
          {["all", "medical", "military", "names", "custom"].map((f) => {
            const count =
              f === "all" ? dictionary.length : dictionary.filter((d) => d.category === f).length;
            return (
              <Button
                key={f}
                variant={dictFilter === f ? "primary" : "ghost"}
                size="sm"
                onClick={() => setDictFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </Button>
            );
          })}
        </div>

        {/* Entries */}
        <CardContent className="flex flex-col gap-1.5 max-h-[400px] overflow-auto">
          {filteredDict.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No dictionary entries</p>
          )}
          {filteredDict.map((d) => {
            const cc = categoryColors[d.category];
            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-md border border-slate-700/30 ${d.enabled ? "bg-slate-800/50" : "bg-slate-900/30 opacity-60"}`}
              >
                <button
                  onClick={() => toggleDictEntry(d.id, d.enabled)}
                  className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center cursor-pointer ${d.enabled ? "bg-blue-600 border-blue-600 text-white" : "border-slate-600"}`}
                >
                  {d.enabled && <span className="text-[10px]">✓</span>}
                </button>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm text-red-500 line-through">{d.wrong_text}</span>
                  <span className="text-slate-500 text-xs">→</span>
                  <span className="text-sm font-semibold text-white">{d.correct_text}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cc?.bg || ""} ${cc?.text || ""}`}
                >
                  {d.category}
                </span>
                <button
                  onClick={() => deleteDictEntry(d.id)}
                  className="text-slate-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
