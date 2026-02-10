"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  Mic,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const [providerId, setProviderId] = useState<Id<"providers"> | null>(null);
  const getOrCreate = useMutation(api.providers.getOrCreate);
  const seedTemplates = useMutation(api.templates.seedDefaults);

  // Initialize provider on first load
  useEffect(() => {
    async function init() {
      const id = await getOrCreate({
        name: "Dr. Provider",
        email: "provider@medscribe.local",
        specialty: "General Practice",
        credentials: "MD",
      });
      setProviderId(id);
      await seedTemplates();
    }
    init();
  }, [getOrCreate, seedTemplates]);

  const encounters = useQuery(
    api.encounters.listByProvider,
    providerId ? { providerId } : "skip"
  );

  const templates = useQuery(api.templates.list);

  const recentEncounters = encounters?.slice(0, 5) ?? [];
  const activeRecordings = encounters?.filter((e) => e.status === "recording") ?? [];
  const pendingReview = encounters?.filter((e) => e.status === "review") ?? [];
  const completed = encounters?.filter((e) => e.status === "complete") ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Welcome back, Dr. Provider
          </p>
        </div>
        <Link href="/encounters?new=true">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Encounter
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-50">
                <Mic className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeRecordings.length}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Active Recordings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReview.length}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Pending Review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completed.length}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Completed Notes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates?.length ?? 0}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Templates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Encounters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Encounters</CardTitle>
            <Link href="/encounters">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentEncounters.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3" />
              <p className="text-[var(--muted-foreground)]">
                No encounters yet. Start a new encounter to begin.
              </p>
              <Link href="/encounters?new=true">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Start First Encounter
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEncounters.map((encounter) => (
                <Link
                  key={encounter._id}
                  href={`/encounters/${encounter._id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Stethoscope className="h-5 w-5 text-[var(--muted-foreground)]" />
                    <div>
                      <p className="font-medium">{encounter.patientName}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {encounter.chiefComplaint || "No chief complaint"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatDateTime(encounter.dateOfService)}
                    </span>
                    <Badge
                      className={getStatusColor(encounter.status)}
                      variant="outline"
                    >
                      {getStatusLabel(encounter.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
