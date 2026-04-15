"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { healthCheck } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function SettingsPage() {
  const { adminUser } = useAuth();
  const [apiUrl, setApiUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setApiUrl(
      localStorage.getItem("api_url") ||
        process.env.NEXT_PUBLIC_API_URL ||
        ""
    );
  }, []);

  function handleSave() {
    localStorage.setItem("api_url", apiUrl);
    toast.success("Settings saved");
  }

  async function handleTest() {
    try {
      const res = await healthCheck();
      setStatus(`OK — v${res.version}`);
      toast.success("Connected");
    } catch (err) {
      setStatus(`Error: ${err}`);
      toast.error("Connection failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>API Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api_url">API URL</Label>
            <Input
              id="api_url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://cutip-rag-bot-xxx.run.app"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={handleTest}>
              Test Connection
            </Button>
            {status && (
              <Badge variant={status.startsWith("OK") ? "default" : "destructive"}>
                {status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{adminUser?.email}</span>
            <span className="text-muted-foreground">Display Name</span>
            <span>{adminUser?.display_name}</span>
            <span className="text-muted-foreground">Role</span>
            <span>
              {adminUser?.role === "super_admin"
                ? "Super Admin"
                : "Faculty Admin"}
            </span>
            {adminUser?.role === "faculty_admin" && (
              <>
                <span className="text-muted-foreground">Assigned Tenants</span>
                <span>
                  {adminUser.tenant_ids.length > 0
                    ? adminUser.tenant_ids.join(", ")
                    : "None"}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
