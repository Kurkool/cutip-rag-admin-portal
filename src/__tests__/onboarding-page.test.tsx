import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/onboarding",
}));

// Mock auth context — faculty admin with one tenant
const mockAuth = {
  firebaseUser: { uid: "fac-001" },
  adminUser: {
    uid: "fac-001",
    email: "eng@cu.ac.th",
    display_name: "Faculty Admin",
    role: "faculty_admin" as const,
    tenant_ids: ["engineering"],
    is_active: true,
    created_at: null,
    updated_at: null,
  },
  loading: false,
  error: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  getIdToken: vi.fn(),
};
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => mockAuth,
}));

// Mock API
const mockGetOnboarding = vi.fn();
const mockUpdateOnboarding = vi.fn();
const mockGetTenant = vi.fn();
const mockUpdateTenant = vi.fn();
vi.mock("@/lib/api", () => ({
  getOnboarding: (...args: unknown[]) => mockGetOnboarding(...args),
  updateOnboarding: (...args: unknown[]) => mockUpdateOnboarding(...args),
  getTenant: (...args: unknown[]) => mockGetTenant(...args),
  updateTenant: (...args: unknown[]) => mockUpdateTenant(...args),
}));

import OnboardingPage from "@/app/onboarding/page";

beforeEach(() => {
  mockGetOnboarding.mockReset();
  mockUpdateOnboarding.mockReset();
  mockGetTenant.mockReset();
  mockUpdateTenant.mockReset();
});

describe("OnboardingPage", () => {
  it("renders all 5 onboarding steps", async () => {
    mockGetOnboarding.mockResolvedValueOnce({
      tenant_id: "engineering",
      completed_steps: [],
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/set persona/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/connect line/i)).toBeInTheDocument();
    expect(screen.getByText(/connect google drive/i)).toBeInTheDocument();
    expect(screen.getByText(/upload documents/i)).toBeInTheDocument();
    expect(screen.getByText(/test chatbot/i)).toBeInTheDocument();
  });

  it("shows completed steps as checked", async () => {
    mockGetOnboarding.mockResolvedValueOnce({
      tenant_id: "engineering",
      completed_steps: [1, 3],
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("step-1-check")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("step-2-check")).not.toBeInTheDocument();
    expect(screen.getByTestId("step-3-check")).toBeInTheDocument();
    expect(screen.queryByTestId("step-4-check")).not.toBeInTheDocument();
    expect(screen.queryByTestId("step-5-check")).not.toBeInTheDocument();
  });

  it("marks a step as complete when clicking complete button", async () => {
    const user = userEvent.setup();
    mockGetOnboarding.mockResolvedValueOnce({
      tenant_id: "engineering",
      completed_steps: [],
    });
    mockUpdateOnboarding.mockResolvedValueOnce({
      tenant_id: "engineering",
      completed_steps: [1],
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/set persona/i)).toBeInTheDocument();
    });

    // Click the first step's complete button
    const completeButtons = screen.getAllByRole("button", {
      name: /mark.*complete/i,
    });
    await user.click(completeButtons[0]);

    await waitFor(() => {
      expect(mockUpdateOnboarding).toHaveBeenCalledWith("engineering", [1]);
    });
  });

  it("shows progress bar reflecting completed steps", async () => {
    mockGetOnboarding.mockResolvedValueOnce({
      tenant_id: "engineering",
      completed_steps: [1, 2, 3],
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/3.*of.*5/i)).toBeInTheDocument();
    });
  });

  it("shows completion message when all 5 steps done", async () => {
    mockGetOnboarding.mockResolvedValueOnce({
      tenant_id: "engineering",
      completed_steps: [1, 2, 3, 4, 5],
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/all steps complete/i)).toBeInTheDocument();
    });
  });
});
