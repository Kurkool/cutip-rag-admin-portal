import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock API — registerFaculty
const mockRegisterFaculty = vi.fn();
vi.mock("@/lib/api", () => ({
  registerFaculty: (...args: unknown[]) => mockRegisterFaculty(...args),
}));

import RegisterPage from "@/app/register/page";

beforeEach(() => {
  mockRegisterFaculty.mockReset();
  mockPush.mockReset();
});

describe("RegisterPage", () => {
  it("renders the registration form with all fields", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/faculty name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
  });

  it("renders a link back to login page", () => {
    render(<RegisterPage />);

    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("submits registration and shows success message", async () => {
    const user = userEvent.setup();
    mockRegisterFaculty.mockResolvedValueOnce({
      id: "abc123",
      faculty_name: "Engineering",
      email: "eng@cu.ac.th",
      note: "",
      status: "pending",
      created_at: "2026-04-15T10:00:00Z",
    });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/faculty name/i), "Engineering");
    await user.type(screen.getByLabelText(/email/i), "eng@cu.ac.th");
    await user.type(screen.getByLabelText(/password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockRegisterFaculty).toHaveBeenCalledWith({
        faculty_name: "Engineering",
        email: "eng@cu.ac.th",
        password: "securepass123",
        note: "",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Registration Submitted/)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    const user = userEvent.setup();
    mockRegisterFaculty.mockRejectedValueOnce(
      new Error("API 422: Email already registered")
    );

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/faculty name/i), "Engineering");
    await user.type(screen.getByLabelText(/email/i), "eng@cu.ac.th");
    await user.type(screen.getByLabelText(/password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already registered/i)).toBeInTheDocument();
    });
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    // Make the API call hang
    mockRegisterFaculty.mockReturnValue(new Promise(() => {}));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/faculty name/i), "Engineering");
    await user.type(screen.getByLabelText(/email/i), "eng@cu.ac.th");
    await user.type(screen.getByLabelText(/password/i), "securepass123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /register/i })).toBeDisabled();
    });
  });
});
