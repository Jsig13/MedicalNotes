"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import TemplateEditor from "@/components/templates/TemplateEditor";
import type { Template, TemplateSection } from "@/types";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("id", params.id)
        .single();
      if (data) setTemplate(data);
      setLoading(false);
    };
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = async (data: {
    name: string;
    description: string;
    category: string;
    sections: TemplateSection[];
  }) => {
    const { error } = await supabase
      .from("templates")
      .update({
        name: data.name,
        description: data.description,
        category: data.category,
        sections: data.sections,
      })
      .eq("id", params.id);
    if (!error) {
      router.push("/templates");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-slate-500">Template not found</p>
        <Button variant="ghost" onClick={() => router.push("/templates")}>
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/templates")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold text-white">Edit Template</h1>
      </div>
      <TemplateEditor
        template={template}
        onSave={handleSave}
        onCancel={() => router.push("/templates")}
      />
    </div>
  );
}
