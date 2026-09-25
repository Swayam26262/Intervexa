"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn, formatDate } from "@/lib/utils";

export interface ResumeItem {
  id: string;
  fileName: string;
  size?: number;
  createdAt: string;
  isActive: boolean;
  demo: boolean;
  hasFile: boolean;
}

export function ResumeLibrary({ resumes, maxResumes }: { resumes: ResumeItem[]; maxResumes: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ResumeItem | null>(null);

  async function upload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/resume", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Upload failed. Please try again.");
        return;
      }
      toast.success(
        data?.profileUpdated?.length ? "Resume analysed — we also filled your skills from it." : data?.replaced ? "Resume analysed. Your oldest resume was replaced." : "Resume analysed.",
      );
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function act(id: string, method: "PATCH" | "DELETE") {
    setBusyId(id);
    const res = await fetch(`/api/resumes/${id}`, { method });
    setBusyId(null);
    if (!res.ok) {
      toast.error((await res.json().catch(() => null))?.error ?? "Something went wrong.");
      return;
    }
    toast.success(method === "PATCH" ? "Interviews will now use this resume" : "Resume deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        id="resume-file"
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        disabled={uploading}
        className={cn(
          "state-layer flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-primary bg-primary-container/40" : "border-outline-variant",
        )}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
        </span>
        <span className="text-title-md">{uploading ? "Analysing your resume…" : resumes.length ? "Upload another resume" : "Upload your resume"}</span>
        <span className="text-body-md text-on-surface-variant">Drag and drop, or click to browse · PDF, DOCX or TXT up to 5 MB</span>
        <span className="text-body-sm text-on-surface-variant">
          {resumes.length}/{maxResumes} stored{maxResumes === 1 ? " — uploading replaces your current resume" : ""}. Files are encrypted at rest.
        </span>
      </button>

      {resumes.length > 0 && (
        <ul className="divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant">
          {resumes.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <FileText className="size-5 shrink-0 text-on-surface-variant" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-title-sm">{r.fileName}</span>
                  {r.isActive && (
                    <Badge variant="primary">
                      <CheckCircle2 /> Active
                    </Badge>
                  )}
                  {r.demo && <Badge variant="outline">Demo analysis</Badge>}
                </div>
                <div className="text-body-sm text-on-surface-variant">
                  Uploaded {formatDate(r.createdAt)}
                  {r.size ? ` · ${Math.max(1, Math.round(r.size / 1024))} KB` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!r.isActive && (
                  <Button variant="text" size="sm" disabled={busyId === r.id} onClick={() => void act(r.id, "PATCH")}>
                    Use for interviews
                  </Button>
                )}
                {r.hasFile && (
                  <Button asChild variant="ghost" size="icon-sm" aria-label={`Download ${r.fileName}`}>
                    <a href={`/api/resumes/${r.id}/file`}>
                      <Download />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${r.fileName}`} onClick={() => setConfirmDelete(r)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        icon={<Trash2 />}
        title="Delete this resume?"
        description={`"${confirmDelete?.fileName}" and its analysis will be permanently deleted. Past interview reports are not affected.`}
        actions={
          <>
            <Button variant="text" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) void act(confirmDelete.id, "DELETE");
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
