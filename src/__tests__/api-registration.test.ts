import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase before importing api
vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));

// We need to mock fetch since these are real HTTP calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set API URL for tests
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

import {
  registerFaculty,
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  getOnboarding,
  updateOnboarding,
} from "@/lib/api";

import type {
  Registration,
  RegistrationRequest,
  OnboardingStatus,
} from "@/lib/types";

beforeEach(() => {
  mockFetch.mockReset();
});

function mockJsonResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 201 ? "Created" : "OK",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe("registerFaculty", () => {
  it("sends POST to /api/auth/register with form data", async () => {
    const registration: Registration = {
      id: "abc123",
      faculty_name: "คณะวิศวกรรมศาสตร์",
      email: "eng@cu.ac.th",
      note: "",
      status: "pending",
      created_at: "2026-04-15T10:00:00Z",
    };
    mockJsonResponse(registration, 201);

    const req: RegistrationRequest = {
      faculty_name: "คณะวิศวกรรมศาสตร์",
      email: "eng@cu.ac.th",
      password: "securepass123",
      note: "",
    };
    const result = await registerFaculty(req);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/auth/register");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(req);
    expect(result).toEqual(registration);
  });
});

describe("listRegistrations", () => {
  it("sends GET to /api/registrations", async () => {
    const registrations: Registration[] = [
      {
        id: "abc123",
        faculty_name: "คณะวิศวกรรมศาสตร์",
        email: "eng@cu.ac.th",
        note: "",
        status: "pending",
        created_at: "2026-04-15T10:00:00Z",
      },
    ];
    mockJsonResponse(registrations);

    const result = await listRegistrations();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/registrations");
    expect(result).toEqual(registrations);
  });
});

describe("approveRegistration", () => {
  it("sends POST to /api/registrations/{id}/approve", async () => {
    const response = {
      status: "approved",
      tenant_id: "engineering",
      uid: "abc123def456",
    };
    mockJsonResponse(response);

    const result = await approveRegistration("reg-001");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/registrations/reg-001/approve");
    expect(options.method).toBe("POST");
    expect(result).toEqual(response);
  });
});

describe("rejectRegistration", () => {
  it("sends POST to /api/registrations/{id}/reject with reason", async () => {
    const response = { status: "rejected", reason: "Duplicate" };
    mockJsonResponse(response);

    const result = await rejectRegistration("reg-001", "Duplicate");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/registrations/reg-001/reject");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ reason: "Duplicate" });
    expect(result).toEqual(response);
  });

  it("sends empty reason when not provided", async () => {
    const response = { status: "rejected", reason: "" };
    mockJsonResponse(response);

    await rejectRegistration("reg-001");

    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ reason: "" });
  });
});

describe("getOnboarding", () => {
  it("sends GET to /api/tenants/{id}/onboarding", async () => {
    const status: OnboardingStatus = {
      tenant_id: "engineering",
      completed_steps: [1, 2],
    };
    mockJsonResponse(status);

    const result = await getOnboarding("engineering");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "http://localhost:8000/api/tenants/engineering/onboarding"
    );
    expect(result).toEqual(status);
  });
});

describe("updateOnboarding", () => {
  it("sends PUT to /api/tenants/{id}/onboarding with completed_steps", async () => {
    const status: OnboardingStatus = {
      tenant_id: "engineering",
      completed_steps: [1, 2, 3],
    };
    mockJsonResponse(status);

    const result = await updateOnboarding("engineering", [1, 2, 3]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "http://localhost:8000/api/tenants/engineering/onboarding"
    );
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ completed_steps: [1, 2, 3] });
    expect(result).toEqual(status);
  });
});
