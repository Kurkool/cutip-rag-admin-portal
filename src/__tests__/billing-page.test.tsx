import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/billing",
}));

// Mock auth context — super admin
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    adminUser: {
      uid: "super-001",
      role: "super_admin",
      tenant_ids: [],
    },
  }),
}));

// Mock recharts to avoid rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
}));

const mockGetAllUsage = vi.fn();
vi.mock("@/lib/api", () => ({
  getAllUsage: (...args: unknown[]) => mockGetAllUsage(...args),
}));

import BillingPage from "@/app/billing/page";

beforeEach(() => {
  mockGetAllUsage.mockReset();
});

const usageData = [
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
  {
    tenant_id: "science",
    month: "2026-04",
    llm_call_count: 30,
    embedding_call_count: 100,
    reranker_call_count: 80,
    vision_call_count: 5,
    llm_call_cost: 1.8,
    embedding_call_cost: 0.1,
    reranker_call_cost: 0.16,
    vision_call_cost: 0.05,
    total_cost: 2.11,
  },
];

describe("BillingPage", () => {
  it("shows total cost across all tenants", async () => {
    mockGetAllUsage.mockResolvedValueOnce(usageData);

    render(<BillingPage />);

    await waitFor(() => {
      // Total = 3.6 + 2.11 = 5.71
      expect(screen.getByText("$5.71")).toBeInTheDocument();
    });
  });

  it("shows per-tenant cost breakdown in a table", async () => {
    mockGetAllUsage.mockResolvedValueOnce(usageData);

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText("engineering")).toBeInTheDocument();
    });
    expect(screen.getByText("science")).toBeInTheDocument();
    // Individual costs shown
    expect(screen.getByText("$3.60")).toBeInTheDocument();
    expect(screen.getByText("$2.11")).toBeInTheDocument();
  });

  it("shows cost breakdown by type", async () => {
    mockGetAllUsage.mockResolvedValueOnce(usageData);

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/LLM/).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText(/Embedding/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Reranker/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Vision/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders a chart", async () => {
    mockGetAllUsage.mockResolvedValueOnce(usageData);

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("shows empty state when no usage data", async () => {
    mockGetAllUsage.mockResolvedValueOnce([]);

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText(/no usage/i)).toBeInTheDocument();
    });
  });

  it("shows error message when API fails", async () => {
    mockGetAllUsage.mockRejectedValueOnce(new Error("API 500: Internal Server Error"));

    render(<BillingPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/API 500: Internal Server Error/)
      ).toBeInTheDocument();
    });
    // Should NOT show empty state
    expect(screen.queryByText(/no usage/i)).not.toBeInTheDocument();
  });
});
