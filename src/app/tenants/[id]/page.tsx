"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, BarChart3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getTenant, updateTenant, deleteTenant } from "@/lib/api";
import { useApi, formatError } from "@/lib/hooks";
import { toast } from "sonner";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const { data: tenant, loading, error, refresh } = useApi(
    () => getTenant(tenantId),
    [tenantId]
  );
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateTenant(tenantId, {
        faculty_name: form.get("faculty_name")?.toString() ?? "",
        line_destination: form.get("line_destination")?.toString() ?? "",
        persona: form.get("persona")?.toString() ?? "",
        is_active: form.get("is_active") === "on",
      });
      toast.success("Tenant updated");
      refresh();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteTenant(tenantId);
      toast.success("Tenant deleted");
      router.push("/tenants");
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!tenant) return <div className="text-destructive">Tenant not found</div>;

  const subPages = [
    { href: `/tenants/${tenantId}/documents`, label: "Documents", icon: FileText },
    { href: `/tenants/${tenantId}/chat-logs`, label: "Chat Logs", icon: MessageSquare },
    { href: `/tenants/${tenantId}/analytics`, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tenant.tenant_id}</h1>
          <p className="text-muted-foreground">{tenant.faculty_name}</p>
        </div>
        <Badge variant={tenant.is_active ? "default" : "secondary"} className="text-sm">
          {tenant.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {subPages.map((p) => (
          <Link key={p.href} href={p.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-2 p-4">
                <p.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{p.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="faculty_name">Faculty Name</Label>
              <Input id="faculty_name" name="faculty_name" defaultValue={tenant.faculty_name} />
            </div>
            <div>
              <Label htmlFor="line_destination">LINE Destination (Bot User ID)</Label>
              <Input id="line_destination" name="line_destination" defaultValue={tenant.line_destination} />
            </div>
            <div>
              <Label>Namespace</Label>
              <Input value={tenant.pinecone_namespace} disabled aria-label="Pinecone namespace" />
              <p className="mt-1 text-xs text-muted-foreground">Cannot be changed (linked to Pinecone index)</p>
            </div>
            <div>
              <Label htmlFor="persona">AI Persona</Label>
              <Textarea id="persona" name="persona" rows={6} defaultValue={tenant.persona} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                defaultChecked={tenant.is_active}
                className="h-4 w-4 rounded border"
                aria-label="Tenant active status"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <Separator />
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Deleting a tenant removes all vectors and configuration permanently.
          </p>
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4" /> Delete Tenant
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {tenantId}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all vectors, chat logs, and configuration. Cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
