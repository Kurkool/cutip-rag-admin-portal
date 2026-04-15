"use client";

import Link from "next/link";
import { Users, FileText, MessageSquare, Activity, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTenants, getDocuments, getAnalytics, getUsage } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Tenant, Analytics, DocumentStats, UsageStats } from "@/lib/types";

interface TenantOverview {
  tenant: Tenant;
  analytics: Analytics;
  documents: DocumentStats;
  usage: UsageStats;
}

async function fetchDashboard(): Promise<TenantOverview[]> {
  const tenants = await listTenants();
  return Promise.all(
    tenants.map(async (tenant) => {
      const [analytics, documents, usage] = await Promise.all([
        getAnalytics(tenant.tenant_id).catch(() => ({
          tenant_id: tenant.tenant_id,
          total_chats: 0,
          unique_users: 0,
          period_start: null,
          period_end: null,
        })),
        getDocuments(tenant.tenant_id).catch(() => ({
          tenant_id: tenant.tenant_id,
          namespace: tenant.pinecone_namespace,
          vector_count: 0,
          documents: [],
        })),
        getUsage(tenant.tenant_id).catch(() => ({
          tenant_id: tenant.tenant_id,
          month: "",
          llm_call_count: 0,
          embedding_call_count: 0,
          reranker_call_count: 0,
          vision_call_count: 0,
          llm_call_cost: 0,
          embedding_call_cost: 0,
          reranker_call_cost: 0,
          vision_call_cost: 0,
          total_cost: 0,
        })),
      ]);
      return { tenant, analytics, documents, usage };
    })
  );
}

export default function DashboardPage() {
  const { data: overviews, loading, error } = useApi(fetchDashboard);

  if (loading) return <div className="text-muted-foreground">Loading dashboard...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!overviews) return null;

  const totalChats = overviews.reduce((sum, o) => sum + o.analytics.total_chats, 0);
  const totalUsers = overviews.reduce((sum, o) => sum + o.analytics.unique_users, 0);
  const totalVectors = overviews.reduce((sum, o) => sum + o.documents.vector_count, 0);
  const totalDocs = overviews.reduce((sum, o) => sum + o.documents.documents.length, 0);
  const totalCost = overviews.reduce((sum, o) => sum + (o.usage.total_cost ?? 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Total Tenants" value={overviews.length} icon={Users} />
        <StatsCard title="Total Chats" value={totalChats} icon={MessageSquare} />
        <StatsCard title="Unique Users" value={totalUsers} icon={Activity} />
        <StatsCard
          title="Documents"
          value={`${totalDocs} files / ${totalVectors} vectors`}
          icon={FileText}
        />
        <StatsCard
          title="Est. Cost"
          value={`$${totalCost.toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Tenant</th>
                  <th className="pb-3 font-medium">Faculty</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Documents</th>
                  <th className="pb-3 font-medium text-right">Vectors</th>
                  <th className="pb-3 font-medium text-right">Chats</th>
                  <th className="pb-3 font-medium text-right">Users</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {overviews.map((o) => (
                  <tr key={o.tenant.tenant_id} className="border-b">
                    <td className="py-3">
                      <Link
                        href={`/tenants/${o.tenant.tenant_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.tenant.tenant_id}
                      </Link>
                    </td>
                    <td className="py-3">{o.tenant.faculty_name}</td>
                    <td className="py-3">
                      <Badge variant={o.tenant.is_active ? "default" : "secondary"}>
                        {o.tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">{o.documents.documents.length}</td>
                    <td className="py-3 text-right">{o.documents.vector_count}</td>
                    <td className="py-3 text-right">{o.analytics.total_chats}</td>
                    <td className="py-3 text-right">{o.analytics.unique_users}</td>
                    <td className="py-3 text-right font-medium">${(o.usage.total_cost ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
