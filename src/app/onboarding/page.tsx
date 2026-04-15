"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  Circle,
  User,
  MessageSquare,
  FolderOpen,
  FileUp,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { getOnboarding, updateOnboarding } from "@/lib/api";

const STEPS = [
  {
    number: 1,
    title: "Set Persona",
    description: "Configure the AI chatbot personality and system prompt",
    icon: User,
    href: (tenantId: string) => `/tenants/${tenantId}`,
  },
  {
    number: 2,
    title: "Connect LINE OA",
    description: "Link your LINE Official Account for chat integration",
    icon: MessageSquare,
    href: (tenantId: string) => `/tenants/${tenantId}`,
  },
  {
    number: 3,
    title: "Connect Google Drive",
    description: "Set up Google Drive folder for document syncing",
    icon: FolderOpen,
    href: (tenantId: string) => `/tenants/${tenantId}/documents`,
  },
  {
    number: 4,
    title: "Upload Documents",
    description: "Ingest your first documents into the knowledge base",
    icon: FileUp,
    href: (tenantId: string) => `/tenants/${tenantId}/documents`,
  },
  {
    number: 5,
    title: "Test Chatbot",
    description: "Send a test message to verify the chatbot works",
    icon: Bot,
    href: (tenantId: string) => `/tenants/${tenantId}`,
  },
];

export default function OnboardingPage() {
  const { adminUser } = useAuth();
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const tenantId = adminUser?.tenant_ids[0] ?? "";

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    getOnboarding(tenantId)
      .then((data) => setCompletedSteps(data.completed_steps))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function markComplete(stepNumber: number) {
    if (completedSteps.includes(stepNumber)) return;
    setActionLoading(stepNumber);
    setError("");
    try {
      const newSteps = [...completedSteps, stepNumber];
      const result = await updateOnboarding(tenantId, newSteps);
      setCompletedSteps(result.completed_steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading onboarding...</span>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">
          No tenant assigned. Please contact an administrator.
        </p>
      </div>
    );
  }

  const completedCount = completedSteps.length;
  const allComplete = completedCount === STEPS.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <p className="text-muted-foreground">
          {completedCount} of {STEPS.length} steps completed
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {allComplete && (
        <Card>
          <CardContent className="py-6 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <p className="font-medium text-green-700">
              All steps complete! Your chatbot is ready.
            </p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.number);
          const Icon = step.icon;

          return (
            <Card
              key={step.number}
              className={isComplete ? "border-green-200 bg-green-50/50" : ""}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isComplete ? (
                      <CheckCircle
                        className="h-5 w-5 text-green-600"
                        data-testid={`step-${step.number}-check`}
                      />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {step.title}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 pl-8">
                  {!isComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markComplete(step.number)}
                      disabled={actionLoading === step.number}
                    >
                      {actionLoading === step.number && (
                        <Loader2 className="animate-spin" />
                      )}
                      Mark as Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(step.href(tenantId))}
                  >
                    {isComplete ? "Review" : "Go to Step"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
