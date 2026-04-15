// ──────────────────────────────────────
// Users / Auth
// ──────────────────────────────────────

export type UserRole = "super_admin" | "faculty_admin";

export interface AdminUser {
  uid: string;
  email: string;
  display_name: string;
  role: UserRole;
  tenant_ids: string[];
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateUser {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
  tenant_ids: string[];
}

export interface UpdateUser {
  display_name?: string;
  role?: UserRole;
  tenant_ids?: string[];
  is_active?: boolean;
}

// ──────────────────────────────────────
// Tenants
// ──────────────────────────────────────

export interface Tenant {
  tenant_id: string;
  faculty_name: string;
  line_destination: string;
  pinecone_namespace: string;
  persona: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateTenant {
  tenant_id: string;
  faculty_name: string;
  line_destination: string;
  line_channel_access_token: string;
  line_channel_secret: string;
  pinecone_namespace: string;
  persona?: string;
  is_active?: boolean;
}

export interface UpdateTenant {
  faculty_name?: string;
  line_destination?: string;
  line_channel_access_token?: string;
  line_channel_secret?: string;
  pinecone_namespace?: string;
  persona?: string;
  is_active?: boolean;
}

export interface DocumentStats {
  tenant_id: string;
  namespace: string;
  vector_count: number;
  documents: DocumentInfo[];
}

export interface DocumentInfo {
  filename: string;
  category: string;
  source_type: string;
}

export interface IngestResult {
  message: string;
  chunks_processed: number;
}

export interface SpreadsheetResult {
  message: string;
  sheets_processed: number;
  chunks_processed: number;
}

export interface GDriveResult {
  total_files: number;
  ingested: { filename: string; chunks: number }[];
  skipped: { filename: string; reason: string }[];
  errors: { filename: string; error: string }[];
}

export interface Analytics {
  tenant_id: string;
  total_chats: number;
  unique_users: number;
  period_start: string | null;
  period_end: string | null;
}

export interface UsageStats {
  tenant_id: string;
  month: string;
  llm_call_count: number;
  embedding_call_count: number;
  reranker_call_count: number;
  vision_call_count: number;
  llm_call_cost: number;
  embedding_call_cost: number;
  reranker_call_cost: number;
  vision_call_cost: number;
  total_cost: number;
}

export interface ChatLog {
  id: string;
  tenant_id: string;
  user_id: string;
  query: string;
  answer: string;
  sources: Record<string, unknown>[];
  created_at: string | null;
}

// ──────────────────────────────────────
// Registration
// ──────────────────────────────────────

export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface Registration {
  id: string;
  faculty_name: string;
  email: string;
  note: string;
  status: RegistrationStatus;
  created_at: string;
}

export interface RegistrationRequest {
  faculty_name: string;
  email: string;
  password: string;
  note: string;
}

export interface ApproveResult {
  status: "approved";
  tenant_id: string;
  uid: string;
}

export interface RejectResult {
  status: "rejected";
  reason: string;
}

// ──────────────────────────────────────
// Onboarding
// ──────────────────────────────────────

export interface OnboardingStatus {
  tenant_id: string;
  completed_steps: number[];
}
