"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { Template } from "@/types";
import { Plus, FileText } from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .order("is_default", { ascending: false });
      if (data) setTemplates(data);
    };
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Note Templates</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Choose, create, and edit templates
          </p>
        </div>
        <Button onClick={() => router.push("/templates/new")}>
          <Plus className="w-4 h-4" /> Create Template
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => (
          <Card
            key={t.id}
            className="cursor-pointer hover:border-blue-400 transition-colors"
          >
            <div
              className="p-5"
              onClick={() => router.push(`/templates/${t.id}`)}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm">{t.name}</span>
                <Badge>{t.category}</Badge>
                {t.is_default && <Badge variant="primary">Default</Badge>}
              </div>
              <p className="text-xs text-slate-500 mb-3">{t.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {(t.sections as { id: string; title: string; order: number }[])
                  .sort((a, b) => a.order - b.order)
                  .map((s) => (
                    <span
                      key={s.id}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                    >
                      {s.title}
                    </span>
                  ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No templates yet</p>
          <p className="text-xs mt-1">Create your first template to get started</p>
        </div>
      )}
    </div>
  );
}
