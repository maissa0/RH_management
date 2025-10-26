"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Upload } from "lucide-react";
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
const uploadFormSchema = z.object({
  file: z
    .custom<File[]>()
    .refine((files) => files && files.length > 0, "File is required"),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

interface JobCandidateUploadProps {
  jobPostId: string;
  onUploadComplete?: () => void;
}

interface UploadResponse {
  success: boolean;
  uploaded: Array<{ key: string; name: string; success: boolean; candidateId?: string }>;
  failed?: Array<{ name: string; error: string }>;
}

// Add retry utility
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

export function JobCandidateUpload({ jobPostId, onUploadComplete }: JobCandidateUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      file: [],
    },
  });

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
      
      // Add the job post ID to the form data
      formData.append("jobPostId", jobPostId);

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
          `Successfully uploaded ${result.uploaded.length} candidate${
            result.uploaded.length > 1 ? "s" : ""
          } for this job post`,
        );
        setIsOpen(false);
        
        // Call the onUploadComplete callback if provided
        if (onUploadComplete) {
          onUploadComplete();
        }
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
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Upload className="size-4" />
          Upload Candidates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Upload Candidates for this Job</DialogTitle>
              <DialogDescription>
                Upload one or more CV files. Candidates will be automatically matched to this job post.
                Supported formats: PDF, DOC, DOCX
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume Files</FormLabel>
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
                  : "Upload and Match"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 