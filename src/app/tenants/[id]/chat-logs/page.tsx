"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getChatLogs } from "@/lib/api";
import { formatError } from "@/lib/hooks";
import type { ChatLog } from "@/lib/types";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function ChatLogsPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLogs(0);
  }, [tenantId]);

  async function loadLogs(newOffset: number) {
    setLoading(true);
    try {
      const data = await getChatLogs(tenantId, PAGE_SIZE, newOffset);
      setLogs(data);
      setOffset(newOffset);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading && logs.length === 0)
    return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Logs</h1>
        <p className="text-muted-foreground">{tenantId}</p>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">No chat logs yet</p>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    User: {log.user_id.slice(0, 12)}...
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("th-TH")
                      : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Question
                  </p>
                  <p className="text-sm">{log.query}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Answer
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{log.answer}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={offset === 0}
          onClick={() => loadLogs(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </Button>
        <span className="self-center text-sm text-muted-foreground">
          Showing {offset + 1}–{offset + logs.length}
        </span>
        <Button
          variant="outline"
          disabled={!hasMore}
          onClick={() => loadLogs(offset + PAGE_SIZE)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
