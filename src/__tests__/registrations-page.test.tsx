import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/registrations",
}));

// Mock auth context
const mockAuth = {
  firebaseUser: { uid: "super-001" },
  adminUser: {
    uid: "super-001",
    email: "admin@cu.ac.th",
    display_name: "Super Admin",
    role: "super_admin" as const,
    tenant_ids: [],
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
const mockListRegistrations = vi.fn();
const mockApproveRegistration = vi.fn();
const mockRejectRegistration = vi.fn();
vi.mock("@/lib/api", () => ({
  listRegistrations: (...args: unknown[]) => mockListRegistrations(...args),
  approveRegistration: (...args: unknown[]) => mockApproveRegistration(...args),
  rejectRegistration: (...args: unknown[]) => mockRejectRegistration(...args),
}));

import RegistrationsPage from "@/app/registrations/page";

beforeEach(() => {
  mockListRegistrations.mockReset();
  mockApproveRegistration.mockReset();
  mockRejectRegistration.mockReset();
});

const pendingRegistrations = [
  {
    id: "reg-001",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    email: "eng@cu.ac.th",
    note: "ต้องการใช้ระบบ",
    status: "pending" as const,
    created_at: "2026-04-15T10:00:00Z",
  },
  {
    id: "reg-002",
    faculty_name: "คณะวิทยาศาสตร์",
    email: "sci@cu.ac.th",
    note: "",
    status: "pending" as const,
    created_at: "2026-04-14T08:00:00Z",
  },
];

describe("RegistrationsPage", () => {
  it("shows loading state then displays registrations", async () => {
    mockListRegistrations.mockResolvedValueOnce(pendingRegistrations);

    render(<RegistrationsPage />);

    // Should show loading initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Should show registrations after loading
    await waitFor(() => {
      expect(screen.getByText("คณะวิศวกรรมศาสตร์")).toBeInTheDocument();
    });
    expect(screen.getByText("คณะวิทยาศาสตร์")).toBeInTheDocument();
    expect(screen.getByText("eng@cu.ac.th")).toBeInTheDocument();
    expect(screen.getByText("sci@cu.ac.th")).toBeInTheDocument();
  });

  it("shows empty state when no pending registrations", async () => {
    mockListRegistrations.mockResolvedValueOnce([]);

    render(<RegistrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no pending/i)).toBeInTheDocument();
    });
  });

  it("approves a registration and removes it from the list", async () => {
    const user = userEvent.setup();
    mockListRegistrations.mockResolvedValueOnce(pendingRegistrations);
    mockApproveRegistration.mockResolvedValueOnce({
      status: "approved",
      tenant_id: "engineering",
      uid: "abc123",
    });

    render(<RegistrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("คณะวิศวกรรมศาสตร์")).toBeInTheDocument();
    });

    // Find the row for the first registration and click approve
    const approveButtons = screen.getAllByRole("button", { name: /approve/i });
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockApproveRegistration).toHaveBeenCalledWith("reg-001");
    });

    // Should remove from list
    await waitFor(() => {
      expect(screen.queryByText("คณะวิศวกรรมศาสตร์")).not.toBeInTheDocument();
    });
  });

  it("rejects a registration with a reason", async () => {
    const user = userEvent.setup();
    mockListRegistrations.mockResolvedValueOnce([pendingRegistrations[0]]);
    mockRejectRegistration.mockResolvedValueOnce({
      status: "rejected",
      reason: "Duplicate request",
    });

    render(<RegistrationsPage />);

    await waitFor(() => {
      expect(screen.getByText("คณะวิศวกรรมศาสตร์")).toBeInTheDocument();
    });

    // Click reject to open dialog
    await user.click(screen.getByRole("button", { name: /reject/i }));

    // Fill in reason in dialog
    await waitFor(() => {
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/reason/i), "Duplicate request");
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(mockRejectRegistration).toHaveBeenCalledWith(
        "reg-001",
        "Duplicate request"
      );
    });

    // Should remove from list
    await waitFor(() => {
      expect(screen.queryByText("คณะวิศวกรรมศาสตร์")).not.toBeInTheDocument();
    });
  });
});
