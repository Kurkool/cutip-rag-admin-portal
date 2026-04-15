"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Custom hook for API data fetching with loading, error, and refresh states.
 * Eliminates duplicate loading/error boilerplate across all pages.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      const msg = formatError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refresh: load };
}

/**
 * Format any error into a user-friendly string.
 * Prevents showing [object Object] in toast notifications.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}
