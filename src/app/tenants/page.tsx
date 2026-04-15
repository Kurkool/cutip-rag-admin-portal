"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTenants } from "@/lib/api";
import { useApi } from "@/lib/hooks";

export default function TenantsPage() {
  const { data: tenants, loading, error } = useApi(listTenants);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <Link href="/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Tenant
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants?.map((t) => (
          <Link key={t.tenant_id} href={`/tenants/${t.tenant_id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{t.tenant_id}</CardTitle>
                <Badge variant={t.is_active ? "default" : "secondary"}>
                  {t.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{t.faculty_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Namespace: {t.pinecone_namespace}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
