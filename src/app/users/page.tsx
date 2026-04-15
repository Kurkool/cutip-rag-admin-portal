"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useApi, formatError } from "@/lib/hooks";
import {
  listUsers,
  listTenants,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/api";
import type { AdminUser, CreateUser, UserRole } from "@/lib/types";
import { toast } from "sonner";

export default function UsersPage() {
  const { adminUser } = useAuth();
  const router = useRouter();

  // Redirect non-super-admins
  if (adminUser?.role !== "super_admin") {
    router.replace("/");
    return null;
  }

  return <UsersContent />;
}

function UsersContent() {
  const { data: users, refresh } = useApi(listUsers);
  const { data: tenants } = useApi(listTenants);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {showCreate && (
        <CreateUserForm
          tenantIds={tenants?.map((t) => t.tenant_id) || []}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      <div className="grid gap-4">
        {users?.map((user) => (
          <UserCard
            key={user.uid}
            user={user}
            allTenantIds={tenants?.map((t) => t.tenant_id) || []}
            onUpdated={refresh}
          />
        ))}
        {users?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No users found
          </p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Create User Form
// ──────────────────────────────────────

function CreateUserForm({
  tenantIds,
  onCreated,
}: {
  tenantIds: string[];
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("faculty_admin");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data: CreateUser = {
        email,
        password,
        display_name: displayName,
        role,
        tenant_ids: role === "faculty_admin" ? selectedTenants : [],
      };
      await createUser(data);
      toast.success(`User ${email} created`);
      onCreated();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTenant(tid: string) {
    setSelectedTenants((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid]
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>
          Add an admin user who can access the portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="super_admin">Super Admin</option>
                <option value="faculty_admin">Faculty Admin</option>
              </select>
            </div>
          </div>

          {role === "faculty_admin" && tenantIds.length > 0 && (
            <div className="space-y-2">
              <Label>Assign Tenants</Label>
              <div className="flex flex-wrap gap-2">
                {tenantIds.map((tid) => (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => toggleTenant(tid)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selectedTenants.includes(tid)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {tid}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────
// User Card
// ──────────────────────────────────────

function UserCard({
  user,
  allTenantIds,
  onUpdated,
}: {
  user: AdminUser;
  allTenantIds: string[];
  onUpdated: () => void;
}) {
  const { adminUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [selectedTenants, setSelectedTenants] = useState<string[]>(
    user.tenant_ids
  );
  const [submitting, setSubmitting] = useState(false);

  const isSelf = adminUser?.uid === user.uid;

  async function handleSave() {
    setSubmitting(true);
    try {
      await updateUser(user.uid, {
        role,
        tenant_ids: role === "faculty_admin" ? selectedTenants : [],
      });
      toast.success("User updated");
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    try {
      await updateUser(user.uid, { is_active: !user.is_active });
      toast.success(user.is_active ? "User disabled" : "User enabled");
      onUpdated();
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete user ${user.email}?`)) return;
    try {
      await deleteUser(user.uid);
      toast.success("User deleted");
      onUpdated();
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  function toggleTenant(tid: string) {
    setSelectedTenants((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid]
    );
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.display_name}</span>
            <Badge
              variant={
                user.role === "super_admin" ? "default" : "secondary"
              }
            >
              {user.role === "super_admin" ? "Super Admin" : "Faculty Admin"}
            </Badge>
            {!user.is_active && (
              <Badge variant="destructive">Disabled</Badge>
            )}
            {isSelf && (
              <Badge variant="outline">You</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.role === "faculty_admin" && user.tenant_ids.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {user.tenant_ids.map((tid) => (
                <span
                  key={tid}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {tid}
                </span>
              ))}
            </div>
          )}

          {editing && (
            <div className="mt-3 space-y-3 rounded-md border p-3">
              <div className="space-y-1">
                <Label>Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="faculty_admin">Faculty Admin</option>
                </select>
              </div>
              {role === "faculty_admin" && allTenantIds.length > 0 && (
                <div className="space-y-1">
                  <Label>Tenants</Label>
                  <div className="flex flex-wrap gap-2">
                    {allTenantIds.map((tid) => (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => toggleTenant(tid)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          selectedTenants.includes(tid)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {tid}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isSelf && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(!editing)}
              title="Edit"
            >
              <UserCog className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleActive}
              title={user.is_active ? "Disable" : "Enable"}
            >
              <Badge
                variant={user.is_active ? "default" : "destructive"}
                className="cursor-pointer text-xs"
              >
                {user.is_active ? "ON" : "OFF"}
              </Badge>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
