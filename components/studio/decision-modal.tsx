"use client";

import { useState } from "react";
import { Match } from "@/types";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { sendDecisionEmail } from "@/actions/send-decision-emails";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DecisionModalProps {
  match: Match;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => Promise<void>;
}

export function DecisionModal({
  match,
  postId,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: DecisionModalProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  
  const handleAccept = () => {
    onAccept();
    onClose();
  };
  
  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
    } catch (error) {
      console.error("Error rejecting candidate:", error);
      toast.error("Failed to reject candidate. Please try again.");
    } finally {
      setIsRejecting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Final Decision</DialogTitle>
          <DialogDescription>
            Would you like to accept or reject {match.candidate.name} for this position?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer" onClick={handleAccept}>
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="font-medium text-green-700">Accept</span>
            <p className="text-xs text-center text-green-600">
              Send an acceptance email with optional notes
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer" onClick={!isRejecting ? handleReject : undefined}>
            {isRejecting ? (
              <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <span className="font-medium text-red-700">Reject</span>
            <p className="text-xs text-center text-red-600">
              {isRejecting ? "Sending rejection email..." : "Send a rejection email automatically"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRejecting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 