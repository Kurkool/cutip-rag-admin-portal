import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

import { getAllUsage, getUsage } from "@/lib/api";
import type { UsageStats } from "@/lib/types";

beforeEach(() => {
  mockFetch.mockReset();
});

function mockJsonResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe("getUsage", () => {
  it("fetches usage for a tenant with cost breakdown fields", async () => {
    const usage: UsageStats = {
      tenant_id: "engineering",
      month: "2026-04",
      llm_call_count: 50,
      embedding_call_count: 200,
      reranker_call_count: 150,
      vision_call_count: 10,
      llm_call_cost: 3.0,
      embedding_call_cost: 0.2,
      reranker_call_cost: 0.3,
      vision_call_cost: 0.1,
      total_cost: 3.6,
    };
    mockJsonResponse(usage);

    const result = await getUsage("engineering", "2026-04");

    expect(result.llm_call_cost).toBe(3.0);
    expect(result.embedding_call_cost).toBe(0.2);
    expect(result.reranker_call_cost).toBe(0.3);
    expect(result.vision_call_cost).toBe(0.1);
    expect(result.total_cost).toBe(3.6);
  });
});

describe("getAllUsage", () => {
  it("fetches usage for all tenants", async () => {
    const usages: UsageStats[] = [
      {
        tenant_id: "engineering",
        month: "2026-04",
        llm_call_count: 50,
        embedding_call_count: 200,
        reranker_call_count: 150,
        vision_call_count: 10,
        llm_call_cost: 3.0,
        embedding_call_cost: 0.2,
        reranker_call_cost: 0.3,
        vision_call_cost: 0.1,
        total_cost: 3.6,
      },
    ];
    mockJsonResponse(usages);

    const result = await getAllUsage("2026-04");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/usage?month=2026-04");
    expect(result).toHaveLength(1);
    expect(result[0].llm_call_cost).toBe(3.0);
  });
});
