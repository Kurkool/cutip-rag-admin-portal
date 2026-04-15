"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTenant } from "@/lib/api";
import { formatError } from "@/lib/hooks";
import { toast } from "sonner";

function getField(form: FormData, name: string): string {
  return (form.get(name) ?? "").toString().trim();
}

export default function CreateTenantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const tenantId = getField(form, "tenant_id");

    try {
      await createTenant({
        tenant_id: tenantId,
        faculty_name: getField(form, "faculty_name"),
        line_destination: getField(form, "line_destination"),
        line_channel_access_token: getField(form, "line_channel_access_token"),
        line_channel_secret: getField(form, "line_channel_secret"),
        pinecone_namespace: tenantId,
        persona: getField(form, "persona"),
      });
      toast.success(`Tenant "${tenantId}" created`);
      router.push(`/tenants/${tenantId}`);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Create Tenant</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tenant_id">Tenant ID</Label>
              <Input
                id="tenant_id"
                name="tenant_id"
                placeholder="e.g. arts_01"
                pattern="^[a-z0-9_]+$"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Lowercase, numbers, underscore only
              </p>
            </div>
            <div>
              <Label htmlFor="faculty_name">Faculty Name</Label>
              <Input
                id="faculty_name"
                name="faculty_name"
                placeholder="e.g. คณะอักษรศาสตร์"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LINE Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="line_destination">Bot User ID (destination)</Label>
              <Input
                id="line_destination"
                name="line_destination"
                placeholder="U..."
                required
              />
            </div>
            <div>
              <Label htmlFor="line_channel_access_token">Channel Access Token</Label>
              <Input
                id="line_channel_access_token"
                name="line_channel_access_token"
                type="password"
                required
              />
            </div>
            <div>
              <Label htmlFor="line_channel_secret">Channel Secret</Label>
              <Input
                id="line_channel_secret"
                name="line_channel_secret"
                type="password"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Persona</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="persona"
              rows={6}
              placeholder="คุณคือผู้ช่วย AI ของคณะ... ตอบคำถามนิสิตเรื่อง..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave empty to use default persona
            </p>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Creating..." : "Create Tenant"}
        </Button>
      </form>
    </div>
  );
}
