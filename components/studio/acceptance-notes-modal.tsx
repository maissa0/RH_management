"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Match } from "@/types";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  notes: z.string().min(1, "Please provide some notes for the candidate"),
});

type FormValues = z.infer<typeof formSchema>;

interface AcceptanceNotesModalProps {
  match: Match;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AcceptanceNotesModal({
  match,
  postId,
  isOpen,
  onClose,
  onSuccess,
}: AcceptanceNotesModalProps) {
  const [isSending, setIsSending] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSending(true);
      const result = await sendDecisionEmail({
        matchId: match.id,
        postId,
        isAccepted: true,
        additionalNotes: values.notes,
      });

      if (result.success) {
        toast.success(result.message);
        form.reset();
        onClose();
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to send acceptance email:", error);
      toast.error("Failed to send acceptance email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acceptance Notes</DialogTitle>
          <DialogDescription>
            Add notes to include in the acceptance email to the candidate.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Congratulations on being selected! We're excited to have you join our team..."
                      className="min-h-[120px]"
                      disabled={isSending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Acceptance"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 