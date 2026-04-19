"use client";

/**
 * ConnectDriveButton
 * ──────────────────
 * One-click Google Drive folder connect flow:
 *   1. User clicks → Google Identity Services requests OAuth token (drive.file scope)
 *   2. Opens Google Picker — user picks a Drive folder
 *   3. Auto-shares the folder with the service account as Editor (uses the
 *      user's OAuth token, so no server-side secret is involved)
 *   4. POSTs folder_id + folder_name to the backend /gdrive/connect endpoint
 *
 * The service account then gains Editor permission, enabling the Stage
 * Upload flow (admin portal uploads → Drive → ingest_v2 with citation).
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FolderSync, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { connectDrive } from "@/lib/api";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const SA_EMAIL = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL || "";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

type PickerDoc = { id: string; name: string; mimeType: string };

// Minimal types for the globals injected by the GSI + gapi scripts.
// We only reference the APIs we actually use.
type TokenClient = { requestAccessToken: () => void };
type TokenResponse = { access_token?: string; error?: string };
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
          }) => TokenClient;
        };
      };
      picker: unknown;
    };
    gapi?: {
      load: (name: string, cb: () => void) => void;
    };
  }
}

async function shareFolderWithServiceAccount(
  accessToken: string,
  folderId: string,
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "writer",
        type: "user",
        emailAddress: SA_EMAIL,
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to share folder with service account: ${text}`);
  }
}

interface Props {
  tenantId: string;
  connectedFolderName?: string;
  onConnected?: () => void;
}

export function ConnectDriveButton({
  tenantId,
  connectedFolderName,
  onConnected,
}: Props) {
  const [loading, setLoading] = useState(false);

  const openPicker = useCallback(
    (accessToken: string) => {
      if (!window.gapi) {
        toast.error("Google API script not loaded yet, please retry");
        setLoading(false);
        return;
      }
      window.gapi.load("picker", () => {
        const picker = window.google as unknown as {
          picker: {
            PickerBuilder: new () => {
              addView: (view: unknown) => ReturnType<
                () => { addView: unknown; setOAuthToken: unknown; setCallback: unknown; build: unknown }
              >;
              setOAuthToken: (t: string) => unknown;
              setCallback: (cb: (data: { action: string; docs?: PickerDoc[] }) => void) => unknown;
              build: () => { setVisible: (v: boolean) => void };
            };
            DocsView: new (viewId: string) => {
              setSelectFolderEnabled: (b: boolean) => unknown;
              setIncludeFolders: (b: boolean) => unknown;
              setMimeTypes: (m: string) => unknown;
            };
            ViewId: { FOLDERS: string };
            Action: { PICKED: string; CANCEL: string };
          };
        };
        const view = new picker.picker.DocsView(picker.picker.ViewId.FOLDERS);
        // Chained setters return `this`; TypeScript can't narrow — cast once.
        (view as unknown as { setSelectFolderEnabled: (b: boolean) => void }).setSelectFolderEnabled(true);
        (view as unknown as { setIncludeFolders: (b: boolean) => void }).setIncludeFolders(true);
        (view as unknown as { setMimeTypes: (m: string) => void }).setMimeTypes(
          "application/vnd.google-apps.folder",
        );

        const builder = new picker.picker.PickerBuilder();
        const built = (builder as unknown as {
          addView: (v: unknown) => unknown;
        }).addView(view);
        (built as unknown as { setOAuthToken: (t: string) => unknown }).setOAuthToken(accessToken);
        (built as unknown as {
          setCallback: (cb: (data: { action: string; docs?: PickerDoc[] }) => void) => unknown;
        }).setCallback(async (data) => {
          if (data.action === picker.picker.Action.PICKED && data.docs?.[0]) {
            const folder = data.docs[0];
            try {
              await shareFolderWithServiceAccount(accessToken, folder.id);
              await connectDrive(tenantId, folder.id, folder.name);
              toast.success(`Connected to '${folder.name}' — SA added as Editor`);
              onConnected?.();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Connect failed");
            } finally {
              setLoading(false);
            }
          } else if (data.action === picker.picker.Action.CANCEL) {
            setLoading(false);
          }
        });
        const pickerInstance = (built as unknown as { build: () => { setVisible: (v: boolean) => void } }).build();
        pickerInstance.setVisible(true);
      });
    },
    [tenantId, onConnected],
  );

  const handleClick = useCallback(() => {
    if (!CLIENT_ID) {
      toast.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
      return;
    }
    if (!SA_EMAIL) {
      toast.error("NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL is not configured");
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      toast.error("Google Identity Services not loaded yet, please retry");
      return;
    }
    setLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          toast.error("OAuth failed: " + (resp.error || "no token"));
          setLoading(false);
          return;
        }
        openPicker(resp.access_token);
      },
    });
    client.requestAccessToken();
  }, [openPicker]);

  return (
    <Button onClick={handleClick} disabled={loading} variant={connectedFolderName ? "outline" : "default"}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...
        </>
      ) : (
        <>
          <FolderSync className="mr-2 h-4 w-4" />
          {connectedFolderName ? `Reconnect Drive` : "Connect Google Drive"}
        </>
      )}
    </Button>
  );
}
