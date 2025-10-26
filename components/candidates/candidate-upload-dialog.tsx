"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadFileModal } from "@/components/candidat/upload-files-modal";

export function CandidateUploadDialog() {
  return (
    <UploadFileModal>
      <Button>
        <Upload className="mr-2 h-4 w-4" />
        Upload CVs
      </Button>
    </UploadFileModal>
  );
}
