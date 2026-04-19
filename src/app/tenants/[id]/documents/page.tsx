"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Upload, FolderSync, Trash2, File, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getDocuments,
  getTenant,
  deleteDocuments,
  deleteDocument,
  stageUpload,
  ingestGDriveScan,
} from "@/lib/api";
import { formatError } from "@/lib/hooks";
import type { DocumentStats, Tenant } from "@/lib/types";
import { toast } from "sonner";
import { ConnectDriveButton } from "@/components/connect-drive-button";

export default function DocumentsPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentStats | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const isConnected = Boolean(tenant?.drive_folder_id);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, t] = await Promise.all([
        getDocuments(tenantId),
        getTenant(tenantId),
      ]);
      setDocs(d);
      setTenant(t);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleStageUpload() {
    const files = fileRef.current?.files;
    if (!files?.length) return;
    if (!isConnected) {
      toast.error("Connect Google Drive before uploading");
      return;
    }
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      try {
        await stageUpload(tenantId, file);
        success++;
      } catch (err) {
        toast.error(`${file.name}: ${formatError(err)}`);
      }
    }
    toast.success(`Uploaded ${success}/${files.length} files to Drive + ingested`);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    loadAll();
  }

  async function handleGDriveScan() {
    if (!tenant?.drive_folder_id) return;
    setScanLoading(true);
    try {
      const result = await ingestGDriveScan(tenantId, tenant.drive_folder_id);
      toast.success(
        `New: ${result.ingested.length}, skipped: ${result.skipped.length}`
      );
      loadAll();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setScanLoading(false);
    }
  }

  async function handleDeleteAll() {
    try {
      const res = await deleteDocuments(tenantId);
      const errs = res.drive_errors.length;
      toast.success(
        `Wiped chatbot + ${res.drive_deleted} Drive files${errs ? ` (${errs} errors)` : ""}`,
      );
      loadAll();
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  async function handleDeleteSingle(filename: string) {
    try {
      const res = await deleteDocument(tenantId, filename);
      const drive = res.drive_removed
        ? " + Drive file"
        : res.drive_error
          ? ` (Drive delete failed: ${res.drive_error})`
          : "";
      toast.success(`Deleted '${filename}': ${res.vectors_deleted} vectors${drive}`);
      loadAll();
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">{tenantId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {docs?.vector_count ?? 0} vectors
          </Badge>
          <Button variant="ghost" size="icon" onClick={loadAll} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File list */}
      <Card>
        <CardHeader>
          <CardTitle>Ingested Files ({docs?.documents.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {docs?.documents.length ? (
            <div className="space-y-2">
              {docs.documents.map((d) => (
                <div
                  key={d.filename}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{d.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{d.category}</Badge>
                    <Badge variant="secondary">{d.source_type}</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger
                        aria-label={`Delete ${d.filename}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {d.filename}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Removes this file&rsquo;s vectors from the chatbot{" "}
                            <strong>and deletes the file from Google Drive</strong>.
                            Cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSingle(d.filename)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents ingested yet</p>
          )}
        </CardContent>
      </Card>

      {/* Google Drive Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync className="h-5 w-5" /> Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Connected: {tenant?.drive_folder_name || tenant?.drive_folder_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Files uploaded here sync to this Drive folder. The service
                    account has Editor access.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleGDriveScan} disabled={scanLoading}>
                  {scanLoading ? "Scanning..." : "Smart Scan (new files)"}
                </Button>
                <ConnectDriveButton
                  tenantId={tenantId}
                  connectedFolderName={tenant?.drive_folder_name}
                  onConnected={loadAll}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Smart Scan picks up new files from the connected Drive folder.
                To re-ingest existing files, use <strong>Delete All Documents</strong> below
                then Smart Scan again.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No Drive folder connected yet. Connect a folder so file
                uploads sync to Drive and citations work in chat answers.
              </p>
              <ConnectDriveButton tenantId={tenantId} onConnected={loadAll} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Stage Upload — gated on connection */}
      <Card className={!isConnected ? "opacity-50 pointer-events-none" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.csv"
            disabled={!isConnected}
          />
          <p className="text-xs text-muted-foreground">
            Supported: PDF, DOCX, DOC, XLSX, CSV. Files are staged to the
            connected Drive folder first (so citations work), then ingested.
          </p>
          <Button onClick={handleStageUpload} disabled={uploading || !isConnected}>
            {uploading ? "Uploading..." : "Upload & Ingest"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger */}
      <Separator />
      <AlertDialog>
        <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
          <Trash2 className="h-4 w-4" /> Delete All Documents
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all documents?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes all {docs?.vector_count} vectors from the chatbot{" "}
              <strong>and deletes every file from the connected Google Drive folder</strong>
              {" "}(folder itself stays). Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
