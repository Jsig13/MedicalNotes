"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProvider } from "@/lib/provider-context";
import TemplateEditor from "@/components/templates/TemplateEditor";
import type { TemplateSection } from "@/types";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NewTemplatePage() {
  const router = useRouter();
  const supabase = createClient();
  const { provider } = useProvider();

  const handleSave = async (data: {
    name: string;
    description: string;
    category: string;
    sections: TemplateSection[];
  }) => {
    if (!provider) return;
    const { error } = await supabase.from("templates").insert({
      provider_id: provider.id,
      name: data.name,
      description: data.description,
      category: data.category,
      sections: data.sections,
      is_default: false,
    });
    if (!error) {
      router.push("/templates");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/templates")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Create Template</h1>
      </div>
      <TemplateEditor onSave={handleSave} onCancel={() => router.push("/templates")} />
    </div>
  );
}
