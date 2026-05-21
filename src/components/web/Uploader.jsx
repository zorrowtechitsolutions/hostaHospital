"use client";

import { Card, CardContent } from "../ui/cards";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Trash2 } from "lucide-react";



export function Uploader() {
  const [files, setFiles] = useState([]);

  async function removeFile(fileId) {
    try {
      const fileToRemove = files.find((f) => f.id === fileId);

      if (fileToRemove?.objectUrl) {
        URL.revokeObjectURL(fileToRemove.objectUrl);
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isDeleting: true } : f)),
      );

      const response = await fetch("https://zorrowtek.in/api/presignurl", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: fileToRemove?.key }),
      });

      if (!response.ok) {
        toast.error("Failed to remove file from storage.");

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, isDeleting: false, error: true } : f,
          ),
        );

        return;
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File removed successfully");
    } catch (err) {
      console.error(err);

      toast.error("Failed to remove file from storage.");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, isDeleting: false, error: true } : f,
        ),
      );
    }
  }

  const uploadFile = async (file) => {
    setFiles((prev) =>
      prev.map((f) => (f.file === file ? { ...f, uploading: true } : f)),
    );

    try {
      // 1. Get presigned URL
      const presignedResponse = await fetch("https://zorrowtek.in/api/presignurl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          role: "user" , id: 3
        }),
      });

      if (!presignedResponse.ok) {
        toast.error("Failed to get presigned URL");

        setFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, uploading: false, progress: 0, error: true }
              : f,
          ),
        );

        return;
      }

      const { presignedUrl, key } = await presignedResponse.json();

      // 2. Upload to S3
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;

            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      progress: Math.round(percent),
                      key,
                    }
                  : f,
              ),
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      uploading: false,
                      progress: 100,
                      error: false,
                    }
                  : f,
              ),
            );

            toast.success("File uploaded successfully");
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (err) {
      console.error(err);

      toast.error("Something went wrong");

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, uploading: false, progress: 0, error: true }
            : f,
        ),
      );
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles.length) return;

    const newFiles = acceptedFiles.map((file) => ({
      id: uuidv4(),
      file,
      uploading: false,
      progress: 0,
      isDeleting: false,
      error: false,
      objectUrl: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((f) => uploadFile(f.file));
  }, []);

  const rejectedFiles = useCallback((fileRejection) => {
    if (!fileRejection.length) return;

    const tooMany = fileRejection.find(
      (r) => r.errors[0]?.code === "too-many-files",
    );

    const tooBig = fileRejection.find(
      (r) => r.errors[0]?.code === "file-too-large",
    );

    if (tooMany) toast.error("Too many files selected (max 5)");
    if (tooBig) toast.error("File size exceeds 10MB limit");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: rejectedFiles,
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
      accept: {
    "image/*": [],
    "video/*": [],
    "audio/*": [],
    "application/pdf": [],
    "application/msword": [],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": []
  },
  });

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.objectUrl) {
          URL.revokeObjectURL(file.objectUrl);
        }
      });
    };
  }, [files]);

  const editFile = async (fileId, newFile) => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, uploading: true, progress: 0, error: false }
          : f,
      ),
    );

    try {
      // 1. get new presigned URL for edit
      const res = await fetch("https://zorrowtek.in/api/presignurl", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: newFile.name,
          contentType: newFile.type,
          key: target.key, // overwrite same object (important)
        }),
      });

      if (!res.ok) throw new Error("Failed to get edit URL");

      const { presignedUrl, key } = await res.json();

      // 2. upload new file (replace)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;

            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? { ...f, progress: Math.round(percent), key }
                  : f,
              ),
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      uploading: false,
                      progress: 100,
                      file: newFile,
                      objectUrl: URL.createObjectURL(newFile),
                    }
                  : f,
              ),
            );

            toast.success("Image updated successfully");
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", newFile.type);
        xhr.send(newFile);
      });
    } catch (err) {
      console.error(err);

      toast.error("Failed to edit image");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, uploading: false, error: true } : f,
        ),
      );
    }
  };

  return (
    <>
      <Card
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed w-full h-64 transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary",
        )}
      >
        <CardContent className="flex items-center justify-center h-full">
          <input {...getInputProps()} />

          {isDragActive ? (
            <p>Drop files here...</p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p>Drag & drop or click to upload</p>
              <Button>Select Files</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((f) => (
            <div key={f.id} className="flex flex-col gap-1">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={f.objectUrl}
                  alt={f.file.name}
                  
                  className="w-full h-full object-cover"
                />

                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removeFile(f.id)}
                  disabled={f.isDeleting}
                >
                  {f.isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";

                    input.onchange = (e) => {
                      const file = e.target.files?.[0];
                      if (file) editFile(f.id, file);
                    };

                    input.click();
                  }}
                >
                  ✏️
                </Button>

                {f.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                    {f.progress}%
                  </div>
                )}

                {f.error && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center text-white">
                    Error
                  </div>
                )}
              </div>

              <p className="text-sm truncate">{f.file.name}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}