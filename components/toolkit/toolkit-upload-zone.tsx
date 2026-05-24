"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, Loader2, X } from "lucide-react";
import {
  ACCEPTED_FILE_TYPES,
  API_BASE_URL,
  MAX_FILE_SIZE,
} from "@/lib/create-assignment/constants";
import type { UploadedFileRef } from "@/lib/toolkit/types";

export type UploadedFileInfo = UploadedFileRef & {
  id: string;
  url: string;
  size: number;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ToolkitUploadZoneProps = {
  uploadedFile: UploadedFileInfo | null;
  isUploading: boolean;
  uploadError: string | null;
  onUploaded: (file: UploadedFileInfo) => void;
  onClear: () => void;
  onUploadError: (message: string) => void;
  onUploadStart: () => void;
  onUploadComplete: () => void;
};

export function ToolkitUploadZone({
  uploadedFile,
  isUploading,
  uploadError,
  onUploaded,
  onClear,
  onUploadError,
  onUploadStart,
  onUploadComplete,
}: ToolkitUploadZoneProps) {
  const uploadFile = useCallback(
    async (file: File) => {
      onUploadStart();

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/api/uploads`, {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as UploadedFileInfo & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Upload failed");
        }

        onUploaded(data);
      } catch (error) {
        onUploadError(
          error instanceof Error ? error.message : "Failed to upload file",
        );
      } finally {
        onUploadComplete();
      }
    },
    [onUploadComplete, onUploadError, onUploadStart, onUploaded],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        void uploadFile(file);
      }
    },
    [uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      disabled: isUploading,
    });

  const rejectionMessage = fileRejections[0]?.errors[0]?.message;

  if (uploadedFile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6]">
            <FileText className="h-5 w-5 text-[#6b7280]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1a1a1a]">
              {uploadedFile.originalName}
            </p>
            <p className="text-xs text-[#6b7280]">
              {formatFileSize(uploadedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:px-6 sm:py-10 ${
          isDragActive
            ? "border-[#1a1a1a] bg-[#f9fafb]"
            : "border-[#d1d5db] bg-white hover:border-[#9ca3af]"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto flex max-w-sm flex-col items-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-[#6b7280]" />
          ) : (
            <CloudUpload className="h-10 w-10 text-[#9ca3af]" strokeWidth={1.5} />
          )}
          <p className="mt-4 text-sm font-medium text-[#1a1a1a] sm:text-base">
            {isUploading
              ? "Uploading..."
              : isDragActive
                ? "Drop your file here"
                : "Choose a file or drag & drop it here"}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af] sm:text-sm">
            PDF or text, up to 10MB
          </p>
          <button
            type="button"
            className="mt-5 rounded-full border border-[#e5e7eb] bg-white px-5 py-2 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#f9fafb]"
          >
            Browse Files
          </button>
        </div>
      </div>
      {(uploadError || rejectionMessage) && (
        <p className="text-sm text-[#ef4444]">
          {uploadError ?? rejectionMessage}
        </p>
      )}
    </div>
  );
}
