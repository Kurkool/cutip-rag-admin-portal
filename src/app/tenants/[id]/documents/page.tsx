"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Upload, FolderSync, Trash2, File, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  deleteDocuments,
  ingestDocument,
  ingestSpreadsheet,
  ingestGDrive,
  ingestGDriveScan,
} from "@/lib/api";
import { formatError } from "@/lib/hooks";
import type { DocumentStats } from "@/lib/types";
import { toast } from "sonner";

const SHEET_EXTS = [".xlsx", ".csv"];

export default function DocumentsPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    loadDocs();
  }, [tenantId]);

  async function loadDocs() {
    setLoading(true);
    try {
      setDocs(await getDocuments(tenantId));
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    const files = fileRef.current?.files;
    if (!files?.length) return;
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
        if (SHEET_EXTS.includes(ext)) {
          await ingestSpreadsheet(tenantId, file);
        } else {
          await ingestDocument(tenantId, file);
        }
        success++;
      } catch (err) {
        toast.error(`${file.name}: ${formatError(err)}`);
      }
    }
    toast.success(`Uploaded ${success}/${files.length} files`);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    loadDocs();
  }

  async function handleGDriveBatch() {
    if (!folderId.trim()) return toast.error("Enter a Google Drive folder ID");
    setGdriveLoading(true);
    try {
      const result = await ingestGDrive(tenantId, folderId.trim());
      toast.success(
        `Ingested ${result.ingested.length} files, skipped ${result.skipped.length}, errors ${result.errors.length}`
      );
      loadDocs();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setGdriveLoading(false);
    }
  }

  async function handleGDriveScan() {
    if (!folderId.trim()) return toast.error("Enter a Google Drive folder ID");
    setGdriveLoading(true);
    try {
      const result = await ingestGDriveScan(tenantId, folderId.trim());
      toast.success(
        `New: ${result.ingested.length}, skipped: ${result.skipped.length}`
      );
      loadDocs();
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setGdriveLoading(false);
    }
  }

  async function handleDeleteAll() {
    try {
      await deleteDocuments(tenantId);
      toast.success("All documents deleted");
      loadDocs();
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
          <Button variant="ghost" size="icon" onClick={loadDocs} aria-label="Refresh documents">
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
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{d.filename}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{d.category}</Badge>
                    <Badge variant="secondary">{d.source_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents ingested yet</p>
          )}
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.csv"
          />
          <p className="text-xs text-muted-foreground">
            Supported: PDF, DOCX, DOC, XLSX, CSV
          </p>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload & Ingest"}
          </Button>
        </CardContent>
      </Card>

      {/* Google Drive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync className="h-5 w-5" /> Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Folder ID</Label>
            <Input
              placeholder="e.g. 1duGSSJxj9g-A2dxNTLROnjBPn7V08aMk"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGDriveBatch} disabled={gdriveLoading}>
              {gdriveLoading ? "Processing..." : "Batch Ingest (all files)"}
            </Button>
            <Button
              variant="outline"
              onClick={handleGDriveScan}
              disabled={gdriveLoading}
            >
              Smart Scan (new only)
            </Button>
          </div>
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
              This will remove all {docs?.vector_count} vectors. Cannot be undone.
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
