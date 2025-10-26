import { Toaster } from "sonner";

export default function InterviewConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster />
      {children}
    </>
  );
} 