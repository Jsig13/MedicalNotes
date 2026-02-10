"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VoiceEnrollment } from "@/components/audio/VoiceEnrollment";
import {
  User,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function SettingsPage() {
  const [providerId, setProviderId] = useState<Id<"providers"> | null>(null);

  // Provider form
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [credentials, setCredentials] = useState("");

  // Dictionary form
  const [showAddTerm, setShowAddTerm] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newAlternatives, setNewAlternatives] = useState("");
  const [newCategory, setNewCategory] = useState("custom");
  const [newPronunciation, setNewPronunciation] = useState("");
  const [dictFilter, setDictFilter] = useState("all");

  const getOrCreate = useMutation(api.providers.getOrCreate);
  const updateProvider = useMutation(api.providers.update);
  const addTerm = useMutation(api.dictionary.add);
  const removeTerm = useMutation(api.dictionary.remove);
  const seedTerms = useMutation(api.dictionary.seedCommonMedicalTerms);

  useEffect(() => {
    async function init() {
      const id = await getOrCreate({
        name: "Dr. Provider",
        email: "provider@medscribe.local",
        specialty: "General Practice",
        credentials: "MD",
      });
      setProviderId(id);
    }
    init();
  }, [getOrCreate]);

  const provider = useQuery(
    api.providers.get,
    providerId ? { id: providerId } : "skip"
  );
  const dictionary = useQuery(
    api.dictionary.listByProvider,
    providerId ? { providerId } : "skip"
  );

  // Populate form from provider data
  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setSpecialty(provider.specialty);
      setCredentials(provider.credentials);
    }
  }, [provider]);

  const handleSaveProfile = async () => {
    if (!providerId) return;
    await updateProvider({
      id: providerId,
      name: name.trim(),
      specialty: specialty.trim(),
      credentials: credentials.trim(),
    });
  };

  const handleAddTerm = async () => {
    if (!providerId || !newTerm.trim()) return;

    const alternatives = newAlternatives
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    await addTerm({
      providerId,
      term: newTerm.trim(),
      alternatives,
      category: newCategory,
      pronunciation: newPronunciation.trim() || undefined,
    });

    setNewTerm("");
    setNewAlternatives("");
    setNewCategory("custom");
    setNewPronunciation("");
    setShowAddTerm(false);
  };

  const handleSeedTerms = async () => {
    if (!providerId) return;
    await seedTerms({ providerId });
  };

  const filteredDictionary = dictionary?.filter(
    (d) => dictFilter === "all" || d.category === dictFilter
  );

  const categoryLabels: Record<string, string> = {
    medication: "Medication",
    diagnosis: "Diagnosis",
    procedure: "Procedure",
    anatomy: "Anatomy",
    custom: "Custom",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Manage your profile, voice enrollment, and custom dictionary
        </p>
      </div>

      {/* Provider Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Provider Profile
          </CardTitle>
          <CardDescription>
            Your information used in generated notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Specialty
              </label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Family Medicine"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Credentials
              </label>
              <Input
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="MD, DO, NP, PA"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} className="gap-2">
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Voice Enrollment */}
      {providerId && <VoiceEnrollment providerId={providerId} />}

      {/* Custom Dictionary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Custom Dictionary
              </CardTitle>
              <CardDescription>
                Add medical terms and common phrases for better transcription
                accuracy
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedTerms}
                className="gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Load Common Terms
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddTerm(true)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Term
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Term Form */}
          {showAddTerm && (
            <div className="p-4 border border-[var(--border)] rounded-lg space-y-3 bg-[var(--muted)]">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Add New Term</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTerm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Correct Spelling *
                  </label>
                  <Input
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g., metoprolol"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Category
                  </label>
                  <Select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="medication">Medication</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="procedure">Procedure</option>
                    <option value="anatomy">Anatomy</option>
                    <option value="custom">Custom</option>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Alternative Spellings / Misheard Versions (comma-separated)
                </label>
                <Input
                  value={newAlternatives}
                  onChange={(e) => setNewAlternatives(e.target.value)}
                  placeholder="e.g., meto pro lol, metoprolal, toprol"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Pronunciation Guide (optional)
                </label>
                <Input
                  value={newPronunciation}
                  onChange={(e) => setNewPronunciation(e.target.value)}
                  placeholder="e.g., meh-TOE-pro-lol"
                />
              </div>
              <Button
                onClick={handleAddTerm}
                disabled={!newTerm.trim()}
                size="sm"
              >
                Add Term
              </Button>
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={dictFilter === "all" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setDictFilter("all")}
            >
              All ({dictionary?.length ?? 0})
            </Button>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const count =
                dictionary?.filter((d) => d.category === key).length ?? 0;
              if (count === 0) return null;
              return (
                <Button
                  key={key}
                  variant={dictFilter === key ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setDictFilter(key)}
                >
                  {label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Terms List */}
          <div className="space-y-2">
            {!filteredDictionary || filteredDictionary.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                No terms in your dictionary yet. Add terms or load common
                medical terms.
              </p>
            ) : (
              filteredDictionary.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{entry.term}</p>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[entry.category] || entry.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      Also: {entry.alternatives.join(", ")}
                    </p>
                    {entry.pronunciation && (
                      <p className="text-xs text-[var(--muted-foreground)] italic">
                        Pronunciation: {entry.pronunciation}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTerm({ id: entry._id })}
                  >
                    <Trash2 className="h-3 w-3 text-[var(--destructive)]" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
