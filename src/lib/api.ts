import { getFirebaseAuth } from "./firebase";
import type {
  AdminUser,
  Analytics,
  ApproveResult,
  ChatLog,
  CreateTenant,
  CreateUser,
  DocumentStats,
  GDriveResult,
  IngestResult,
  OnboardingStatus,
  Registration,
  RegistrationRequest,
  RejectResult,
  SpreadsheetResult,
  Tenant,
  UpdateTenant,
  UpdateUser,
  UsageStats,
} from "./types";

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("api_url") ||
      process.env.NEXT_PUBLIC_API_URL ||
      ""
    );
  }
  return process.env.NEXT_PUBLIC_API_URL || "";
}

function getIngestUrl(): string {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("ingest_url") ||
      process.env.NEXT_PUBLIC_INGEST_URL ||
      getApiUrl()
    );
  }
  return process.env.NEXT_PUBLIC_INGEST_URL || getApiUrl();
}

async function fetchWithAuthRefresh(url: string, options: RequestInit): Promise<Response> {
  const baseHeaders = (options.headers as Record<string, string>) || {};
  let res = await fetch(url, {
    ...options,
    headers: { ...(await getAuthHeader()), ...baseHeaders },
  });

  if (res.status === 401 && typeof window !== "undefined" && getFirebaseAuth().currentUser) {
    res = await fetch(url, {
      ...options,
      headers: { ...(await getAuthHeader(true)), ...baseHeaders },
    });
    if (res.status === 401) {
      try {
        await getFirebaseAuth().signOut();
      } catch {
        // ignore signOut errors — redirect still happens
      }
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
  }

  return res;
}

async function ingestRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiUrl = getIngestUrl();
  const url = `${apiUrl}${path}`;
  const res = await fetchWithAuthRefresh(url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function getAuthHeader(forceRefresh = false): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  const user = getFirebaseAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken(forceRefresh);
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${path}`;
  const res = await fetchWithAuthRefresh(url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ──────────────────────────────────────
// Tenants
// ──────────────────────────────────────

export async function listTenants(): Promise<Tenant[]> {
  return request("/api/tenants");
}

export async function createTenant(data: CreateTenant): Promise<Tenant> {
  return request("/api/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getTenant(id: string): Promise<Tenant> {
  return request(`/api/tenants/${id}`);
}

export async function updateTenant(
  id: string,
  data: UpdateTenant
): Promise<Tenant> {
  return request(`/api/tenants/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteTenant(id: string): Promise<void> {
  return request(`/api/tenants/${id}`, { method: "DELETE" });
}

// ──────────────────────────────────────
// Documents
// ──────────────────────────────────────

export async function getDocuments(tenantId: string): Promise<DocumentStats> {
  return request(`/api/tenants/${tenantId}/documents`);
}

export async function deleteDocuments(tenantId: string): Promise<void> {
  return request(`/api/tenants/${tenantId}/documents`, { method: "DELETE" });
}

export async function ingestDocument(
  tenantId: string,
  file: File,
  category: string = "general"
): Promise<IngestResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_category", category);
  return ingestRequest(`/api/tenants/${tenantId}/ingest/document`, {
    method: "POST",
    body: form,
  });
}

export async function ingestSpreadsheet(
  tenantId: string,
  file: File,
  category: string = "general"
): Promise<SpreadsheetResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_category", category);
  return ingestRequest(`/api/tenants/${tenantId}/ingest/spreadsheet`, {
    method: "POST",
    body: form,
  });
}

export async function ingestGDrive(
  tenantId: string,
  folderId: string,
  category: string = "general"
): Promise<GDriveResult> {
  return ingestRequest(`/api/tenants/${tenantId}/ingest/gdrive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId, doc_category: category }),
  });
}

export async function ingestGDriveScan(
  tenantId: string,
  folderId: string,
  category: string = "general"
): Promise<GDriveResult> {
  return ingestRequest(`/api/tenants/${tenantId}/ingest/gdrive/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId, doc_category: category }),
  });
}

export async function ingestGDriveFile(
  tenantId: string,
  folderId: string,
  filename: string,
  category: string = "general"
): Promise<IngestResult> {
  return ingestRequest(`/api/tenants/${tenantId}/ingest/gdrive/file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder_id: folderId,
      filename,
      doc_category: category,
    }),
  });
}

// ──────────────────────────────────────
// Analytics
// ──────────────────────────────────────

export async function getAnalytics(tenantId: string): Promise<Analytics> {
  return request(`/api/tenants/${tenantId}/analytics`);
}

export async function getChatLogs(
  tenantId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatLog[]> {
  return request(
    `/api/tenants/${tenantId}/chat-logs?limit=${limit}&offset=${offset}`
  );
}

// ──────────────────────────────────────
// Usage
// ──────────────────────────────────────

export async function getUsage(
  tenantId: string,
  month?: string
): Promise<UsageStats> {
  const params = month ? `?month=${month}` : "";
  return request(`/api/tenants/${tenantId}/usage${params}`);
}

export async function getAllUsage(month?: string): Promise<UsageStats[]> {
  const params = month ? `?month=${month}` : "";
  return request(`/api/usage${params}`);
}

// ──────────────────────────────────────
// Users (Super Admin)
// ──────────────────────────────────────

export async function listUsers(): Promise<AdminUser[]> {
  return request("/api/users");
}

export async function createUser(data: CreateUser): Promise<AdminUser> {
  return request("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getUser(uid: string): Promise<AdminUser> {
  return request(`/api/users/${uid}`);
}

export async function updateUser(
  uid: string,
  data: UpdateUser
): Promise<AdminUser> {
  return request(`/api/users/${uid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  return request(`/api/users/${uid}`, { method: "DELETE" });
}

// ──────────────────────────────────────
// Registration
// ──────────────────────────────────────

export async function registerFaculty(
  data: RegistrationRequest
): Promise<Registration> {
  return request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function listRegistrations(): Promise<Registration[]> {
  return request("/api/registrations");
}

export async function approveRegistration(
  id: string
): Promise<ApproveResult> {
  return request(`/api/registrations/${id}/approve`, { method: "POST" });
}

export async function rejectRegistration(
  id: string,
  reason: string = ""
): Promise<RejectResult> {
  return request(`/api/registrations/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

// ──────────────────────────────────────
// Onboarding
// ──────────────────────────────────────

export async function getOnboarding(
  tenantId: string
): Promise<OnboardingStatus> {
  return request(`/api/tenants/${tenantId}/onboarding`);
}

export async function updateOnboarding(
  tenantId: string,
  completedSteps: number[]
): Promise<OnboardingStatus> {
  return request(`/api/tenants/${tenantId}/onboarding`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed_steps: completedSteps }),
  });
}

// ──────────────────────────────────────
// Health
// ──────────────────────────────────────

export async function healthCheck(): Promise<{
  status: string;
  version: string;
}> {
  return request("/health");
}
