"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign, Cpu, Search, Eye } from "lucide-react";
import { RoleGate } from "@/components/role-gate";
import { StatsCard } from "@/components/stats-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getAllUsage } from "@/lib/api";
import type { UsageStats } from "@/lib/types";

export default function BillingPage() {
  return (
    <RoleGate role="super_admin">
      <BillingContent />
    </RoleGate>
  );
}

function BillingContent() {
  const [usages, setUsages] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllUsage()
      .then(setUsages)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading billing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (usages.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No usage data for the current month
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCost = usages.reduce((sum, u) => sum + (u.total_cost ?? 0), 0);
  const totalLlmCost = usages.reduce((sum, u) => sum + (u.llm_call_cost ?? 0), 0);
  const totalEmbedCost = usages.reduce((sum, u) => sum + (u.embedding_call_cost ?? 0), 0);
  const totalRerankCost = usages.reduce((sum, u) => sum + (u.reranker_call_cost ?? 0), 0);
  const totalVisionCost = usages.reduce((sum, u) => sum + (u.vision_call_cost ?? 0), 0);

  const chartData = usages.map((u) => ({
    tenant: u.tenant_id,
    LLM: u.llm_call_cost ?? 0,
    Embedding: u.embedding_call_cost ?? 0,
    Reranker: u.reranker_call_cost ?? 0,
    Vision: u.vision_call_cost ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Cost overview for {usages[0]?.month ?? "current month"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Cost"
          value={`$${totalCost.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatsCard
          title="LLM"
          value={`$${totalLlmCost.toFixed(2)}`}
          icon={Cpu}
        />
        <StatsCard
          title="Embedding"
          value={`$${totalEmbedCost.toFixed(2)}`}
          icon={Search}
        />
        <StatsCard
          title="Reranker"
          value={`$${totalRerankCost.toFixed(2)}`}
          icon={Search}
        />
        <StatsCard
          title="Vision"
          value={`$${totalVisionCost.toFixed(2)}`}
          icon={Eye}
        />
      </div>

      {/* Chart: Cost per tenant by type */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tenant" />
              <YAxis tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="LLM" stackId="a" fill="#8884d8" />
              <Bar dataKey="Embedding" stackId="a" fill="#82ca9d" />
              <Bar dataKey="Reranker" stackId="a" fill="#ffc658" />
              <Bar dataKey="Vision" stackId="a" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-tenant table */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Tenant Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Tenant</th>
                  <th className="pb-3 font-medium text-right">LLM</th>
                  <th className="pb-3 font-medium text-right">Embedding</th>
                  <th className="pb-3 font-medium text-right">Reranker</th>
                  <th className="pb-3 font-medium text-right">Vision</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u) => (
                  <tr key={u.tenant_id} className="border-b">
                    <td className="py-3 font-medium">{u.tenant_id}</td>
                    <td className="py-3 text-right">
                      ${(u.llm_call_cost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      ${(u.embedding_call_cost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      ${(u.reranker_call_cost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      ${(u.vision_call_cost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      ${(u.total_cost ?? 0).toFixed(2)}
                    </td>
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
