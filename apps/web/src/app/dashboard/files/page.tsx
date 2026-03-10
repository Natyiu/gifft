"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload, FileIcon, Trash2, ExternalLink } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { uploadFile, deleteFile, buildPublicUrl } from "@/lib/supabase";
import { getStorageUrl } from "@/lib/actions/user";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { FilesSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type UploadedFile = {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string };
};

export default function FilesPage() {
  const { data: session, isPending } = authClient.useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [storageUrl, setStorageUrl] = useState("");

  const fetchFiles = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch(`/api/files?bucket=uploads&prefix=${session.user.id}`);
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files ?? []);
      }
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  if (isPending) return <FilesSkeleton />;
  if (!session) return null;

  if (!initialized) {
    setInitialized(true);
    fetchFiles();
    getStorageUrl().then(setStorageUrl);
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(fileList)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        continue;
      }

      const path = `${session!.user.id}/${Date.now()}-${file.name}`;
      const result = await uploadFile("uploads", path, file);

      if ("error" in result) {
        toast.error(`Failed to upload ${file.name}: ${result.error}`);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded`);
      fetchFiles();
    }
    setUploading(false);
  }

  async function handleDelete(fileName: string) {
    const path = `${session!.user.id}/${fileName}`;
    const result = await deleteFile("uploads", path);
    if (result.success) {
      toast.success("File deleted");
      fetchFiles();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileUrl(fileName: string) {
    return buildPublicUrl(storageUrl, "uploads", `${session!.user.id}/${fileName}`);
  }

  const isImage = (mime: string) => mime?.startsWith("image/");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-lg">
          A ready-to-use file upload system powered by Supabase Storage. Use
          this as a reference to add uploads anywhere in your app — the upload
          API, drag-and-drop UI, and storage helpers are all wired up and
          reusable.
        </p>
      </div>

      <Card className="border-border/30 bg-card/50">
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border/30 hover:border-border hover:bg-muted/20",
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 mx-auto mb-3",
                dragging ? "text-primary" : "text-muted-foreground",
              )}
            />
            <p className="text-xs font-medium">
              {uploading
                ? "Uploading..."
                : "Drop files here or click to browse"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Max 50MB per file
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </CardContent>
      </Card>

      <Card className="border-border/30 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm">Your Files</CardTitle>
          <CardDescription className="text-xs">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-border">
                  <Skeleton className="h-24 w-full" />
                  <div className="p-3 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No files uploaded yet
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {files.map((f) => (
                <div
                  key={f.id || f.name}
                  className="border border-border/30 p-3 space-y-2"
                >
                  {isImage(f.metadata?.mimetype) ? (
                    <div className="h-24 bg-muted/30 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFileUrl(f.name)}
                        alt={f.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-muted/30 flex items-center justify-center">
                      <FileIcon className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium truncate" title={f.name}>
                      {f.name.replace(/^\d+-/, "")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(f.metadata?.size ?? 0)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <a
                      href={getFileUrl(f.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this file.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(f.name)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
