import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/utils/toast";
import { deleteUser, listUsers, updateUser } from "@/services/adminService";
import type { AdminUser, ListUsersParams, UpdateUserPayload } from "@/types/admin";
import type { UserRole } from "@/types/auth";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  Check,
  ShieldCheck,
  Users,
  Search,
  Trash2,
  RotateCcw,
} from "lucide-react";

const ROLES: UserRole[] = ["user", "therapist", "admin"];

const ROLE_BADGE: Record<UserRole, string> = {
  admin: "bg-primary/15 text-primary",
  therapist: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  user: "bg-muted text-muted-foreground",
};

const SkeletonRow = () => (
  <tr>
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-muted animate-pulse rounded" />
      </td>
    ))}
  </tr>
);

interface EditDraft {
  role: UserRole;
  isPro: boolean;
}

const LIMIT = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [proFilter, setProFilter] = useState<"" | "true" | "false">("");
  const [proSinceFrom, setProSinceFrom] = useState("");
  const [proSinceTo, setProSinceTo] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ role: "user", isPro: false });
  const [saving, setSaving] = useState(false);

  // Soft delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce search input
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchInputChange = (v: string) => {
    setSearchInput(v);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(v.trim());
      setPage(1);
    }, 400);
  };

  const buildParams = useCallback((): ListUsersParams => {
    const p: ListUsersParams = { page, limit: LIMIT };
    if (search) p.search = search;
    if (roleFilter) p.role = roleFilter;
    if (proFilter === "true") p.isPro = true;
    if (proFilter === "false") p.isPro = false;
    if (proSinceFrom) p.proSinceFrom = proSinceFrom;
    if (proSinceTo) p.proSinceTo = proSinceTo;
    if (includeDeleted) p.includeDeleted = true;
    return p;
  }, [page, search, roleFilter, proFilter, proSinceFrom, proSinceTo, includeDeleted]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await listUsers(buildParams());
        if (!cancelled) {
          setUsers(res.data);
          setTotalPages(res.pages);
          setTotal(res.total);
        }
      } catch (err) {
        if (!cancelled) {
          showToast.error(err instanceof Error ? err.message : "Failed to load users.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [buildParams]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setProFilter("");
    setProSinceFrom("");
    setProSinceTo("");
    setIncludeDeleted(false);
    setPage(1);
  };

  const hasFilters = search || roleFilter || proFilter || proSinceFrom || proSinceTo || includeDeleted;

  // Edit handlers
  const startEdit = (u: AdminUser) => {
    setDeletingId(null);
    setEditingId(u._id);
    setEditDraft({ role: u.role, isPro: u.isPro });
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setSaving(true);
    const payload: UpdateUserPayload = { role: editDraft.role, isPro: editDraft.isPro };
    const prev = users.find((u) => u._id === id);
    setUsers((us) => us.map((u) => (u._id === id ? { ...u, ...payload } : u)));
    setEditingId(null);
    try {
      const res = await updateUser(id, payload);
      setUsers((us) => us.map((u) => (u._id === id ? res.data : u)));
      showToast.success("User updated.");
    } catch (err) {
      if (prev) setUsers((us) => us.map((u) => (u._id === id ? prev : u)));
      showToast.error(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  // Soft delete handlers
  const confirmDelete = (id: string) => {
    setEditingId(null);
    setDeletingId(id);
  };
  const cancelDelete = () => setDeletingId(null);

  const executeDelete = async (id: string) => {
    setSaving(true);
    setDeletingId(null);
    try {
      const res = await deleteUser(id);
      if (includeDeleted) {
        setUsers((us) => us.map((u) => (u._id === id ? res.data : u)));
      } else {
        setUsers((us) => us.filter((u) => u._id !== id));
        setTotal((t) => t - 1);
      }
      showToast.success("User deleted.");
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users size={22} className="text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {total > 0 ? `${total} user${total !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
          {/* Search + role row */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search name or email…"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Role filter */}
            <Select
              value={roleFilter || "all"}
              onValueChange={(v) => { setRoleFilter(v === "all" ? "" : v as UserRole); setPage(1); }}
            >
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pro filter */}
            <Select
              value={proFilter || "all"}
              onValueChange={(v) => { setProFilter(v === "all" ? "" : v as "true" | "false"); setPage(1); }}
            >
              <SelectTrigger className="h-9 w-32 text-sm">
                <SelectValue placeholder="Pro status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Pro only</SelectItem>
                <SelectItem value="false">Non-Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pro date range + includeDeleted */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Pro since:</label>
            <Input
              type="date"
              value={proSinceFrom}
              onChange={(e) => { setProSinceFrom(e.target.value); setPage(1); }}
              className="h-9 w-36 text-sm"
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={proSinceTo}
              onChange={(e) => { setProSinceTo(e.target.value); setPage(1); }}
              className="h-9 w-36 text-sm"
              placeholder="To"
            />

            <label className="flex items-center gap-2 ml-auto cursor-pointer text-sm text-muted-foreground">
              <Switch
                checked={includeDeleted}
                onCheckedChange={(v) => { setIncludeDeleted(v); setPage(1); }}
              />
              Show deleted
            </label>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 gap-1 text-xs text-muted-foreground"
              >
                <RotateCcw size={12} />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Name", "Email", "Role", "Pro", "Pro Since", "Joined", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                        i === 1 ? "hidden sm:table-cell" :
                        i === 4 ? "hidden lg:table-cell" :
                        i === 5 ? "hidden md:table-cell" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading
                  ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  : users.map((u) => {
                      const isEditing = editingId === u._id;
                      const isDeleting = deletingId === u._id;
                      return (
                        <tr
                          key={u._id}
                          className={`transition-colors ${
                            u.isDeleted ? "opacity-50" :
                            isEditing || isDeleting ? "bg-accent/30" : "hover:bg-muted/40"
                          }`}
                        >
                          {/* Name */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground flex items-center gap-1.5">
                              {u.name}
                              {u.isDeleted && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">
                                  deleted
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden mt-0.5">{u.email}</div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <Select
                                value={editDraft.role}
                                onValueChange={(v) => setEditDraft((d) => ({ ...d, role: v as UserRole }))}
                              >
                                <SelectTrigger className="h-8 w-32 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((r) => (
                                    <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_BADGE[u.role]}`}>
                                {u.role === "admin" && <ShieldCheck size={11} />}
                                {u.role}
                              </span>
                            )}
                          </td>

                          {/* Pro toggle */}
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <Switch
                                checked={editDraft.isPro}
                                onCheckedChange={(v) => setEditDraft((d) => ({ ...d, isPro: v }))}
                              />
                            ) : u.isPro ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                Pro
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">—</span>
                            )}
                          </td>

                          {/* Pro Since */}
                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                            {formatDate(u.proSince)}
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                            {formatDate(u.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {isDeleting ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-destructive mr-1">Delete?</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelDelete}
                                  disabled={saving}
                                  className="h-7 w-7 p-0 text-muted-foreground"
                                  aria-label="Cancel delete"
                                >
                                  <X size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => executeDelete(u._id)}
                                  disabled={saving}
                                  className="h-7 px-2 text-xs"
                                  aria-label="Confirm delete"
                                >
                                  <Trash2 size={13} className="mr-1" />
                                  Yes
                                </Button>
                              </div>
                            ) : isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="h-7 w-7 p-0 text-muted-foreground"
                                  aria-label="Cancel"
                                >
                                  <X size={15} />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(u._id)}
                                  disabled={saving}
                                  className="h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                                >
                                  <Check size={13} className="mr-1" />
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(u)}
                                  disabled={u.isDeleted}
                                  className="h-7 px-2 text-muted-foreground hover:text-foreground text-xs gap-1"
                                >
                                  <Pencil size={13} />
                                  Edit
                                </Button>
                                {!u.isDeleted && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => confirmDelete(u._id)}
                                    className="h-7 px-2 text-muted-foreground hover:text-destructive text-xs gap-1"
                                    aria-label="Delete user"
                                  >
                                    <Trash2 size={13} />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {!loading && users.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No users found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft size={15} />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
