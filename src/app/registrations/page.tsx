"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Registration } from "@/lib/types";

export default function RegistrationsPage() {
  const { adminUser } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function loadRegistrations() {
    try {
      const data = await listRegistrations();
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    setError("");
    try {
      await approveRegistration(id);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    setError("");
    try {
      await rejectRegistration(id, rejectReason);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (adminUser?.role !== "super_admin") {
    router.replace("/");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading registrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Registrations</h1>
        <p className="text-muted-foreground">
          Review and approve faculty registration requests
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending registrations
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{reg.faculty_name}</CardTitle>
                    <CardDescription>{reg.email}</CardDescription>
                  </div>
                  <Badge variant="secondary">{reg.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {reg.note && (
                  <p className="text-sm text-muted-foreground">
                    Note: {reg.note}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(reg.created_at).toLocaleString("th-TH")}
                </p>

                {rejectingId === reg.id ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-2">
                      <Label htmlFor={`reason-${reg.id}`}>
                        Rejection Reason
                      </Label>
                      <Input
                        id={`reason-${reg.id}`}
                        placeholder="Enter reason for rejection"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(reg.id)}
                        disabled={actionLoading === reg.id}
                      >
                        {actionLoading === reg.id && (
                          <Loader2 className="animate-spin" />
                        )}
                        Confirm Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(reg.id)}
                      disabled={actionLoading === reg.id}
                    >
                      {actionLoading === reg.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingId(reg.id)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
