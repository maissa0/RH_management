"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Create Zod schema for the form
export const uploadFormSchema = z.object({
  file: z
    .custom<File[]>()
    .refine((files) => files && files.length > 0, "File is required"),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

interface UploadFileModalProps {
  children: React.ReactNode;
}

interface UploadResponse {
  success: boolean;
  uploaded: Array<{ key: string; name: string; success: boolean }>;
  failed?: Array<{ name: string; error: string }>;
}

// Add retry utility before the UploadFileModal component
interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 2, delayMs: 1000 },
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === options.maxAttempts) break;
      await new Promise((resolve) =>
        setTimeout(resolve, options.delayMs * attempt),
      );
    }
  }

  throw lastError;
}

export function UploadFileModal({ children }: UploadFileModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      file: [],
    },
  });
  const errors = form.formState.errors;
  console.log(errors);

  const handleFileUpload = (uploadedFiles: File[]) => {
    if (isUploading) return;
    form.setValue("file", uploadedFiles);
  };

  const onSubmit = async (data: UploadFormValues) => {
    if (isUploading || !data.file.length) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      data.file.forEach((file) => {
        formData.append("file", file);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      });

      const result = await retryOperation(
        async () => {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Upload failed with status ${uploadRes.status}`,
            );
          }

          return (await uploadRes.json()) as UploadResponse;
        },
        { maxAttempts: 3, delayMs: 2000 },
      );

      if (result.failed?.length) {
        result.failed.forEach(({ name, error }) => {
          toast.error(`Failed to upload ${name}: ${error}`);
        });
      }

      if (result.uploaded.length) {
        toast.success(
          `Successfully uploaded ${result.uploaded.length} file${
            result.uploaded.length > 1 ? "s" : ""
          }`,
        );
        setIsOpen(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        err instanceof Error
          ? `Upload failed: ${err.message}. Please try again.`
          : "Failed to upload files. Please try again.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Upload files</DialogTitle>
              <DialogDescription>
                Upload one or more CV files. Supported formats: PDF, DOC, DOCX, PNG, JPEG, JPG
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div className="min-h-96 w-full rounded-lg border border-dashed border-neutral-200 bg-background dark:border-neutral-800">
                        <FileUpload
                          onChange={handleFileUpload}
                          accept={{
                            "application/pdf": [".pdf"],
                            "application/msword": [".doc"],
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                              [".docx"],
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isUploading}
                aria-busy={isUploading}
              >
                {isUploading
                  ? `Uploading ${Object.keys(uploadProgress).length} files...`
                  : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function validateFiles(files: File[]): File[] {
  const MAX_SIZE_MB = 5;
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/mov",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  return files.filter((file) => {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`File too large: ${file.name} (max ${MAX_SIZE_MB}MB)`);
    }
    return true;
  });
}
