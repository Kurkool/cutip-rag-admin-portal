"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Users, FileText, DollarSign, Cpu, Search } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics, getDocuments, getUsage } from "@/lib/api";
import type { Analytics, DocumentStats, UsageStats } from "@/lib/types";

export default function AnalyticsPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [docs, setDocs] = useState<DocumentStats | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalytics(tenantId).catch(() => null),
      getDocuments(tenantId).catch(() => null),
      getUsage(tenantId).catch(() => null),
    ]).then(([a, d, u]) => {
      setAnalytics(a);
      setDocs(d);
      setUsage(u);
      setLoading(false);
    });
  }, [tenantId]);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">{tenantId}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Chats"
          value={analytics?.total_chats ?? 0}
          icon={MessageSquare}
        />
        <StatsCard
          title="Unique Users"
          value={analytics?.unique_users ?? 0}
          icon={Users}
        />
        <StatsCard
          title="Vectors"
          value={docs?.vector_count ?? 0}
          icon={FileText}
          description={`${docs?.documents.length ?? 0} files`}
        />
      </div>

      {/* API Usage (Current Month) */}
      {usage && (
        <>
          <h2 className="text-xl font-semibold pt-2">
            API Usage — {usage.month || "Current Month"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="LLM Calls"
              value={usage.llm_call_count ?? 0}
              icon={Cpu}
            />
            <StatsCard
              title="Search Calls"
              value={(usage.embedding_call_count ?? 0) + (usage.reranker_call_count ?? 0)}
              icon={Search}
              description={`${usage.embedding_call_count ?? 0} embed + ${usage.reranker_call_count ?? 0} rerank`}
            />
            <StatsCard
              title="Est. Cost"
              value={`$${(usage.total_cost ?? 0).toFixed(2)}`}
              icon={DollarSign}
            />
          </div>
        </>
      )}

      {/* Document breakdown */}
      {docs?.documents.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Document Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(
                docs.documents.reduce(
                  (acc, d) => {
                    acc[d.category] = (acc[d.category] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )
              ).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{cat}</span>
                  <span className="text-sm font-medium">{count} files</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
