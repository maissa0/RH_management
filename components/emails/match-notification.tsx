import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format } from "date-fns";
import type { Match } from "@/types";

interface InterviewDetails {
  type: "ONLINE" | "IN_PERSON";
  date: Date;
  time: string;
  location?: string;
  meetLink?: string;
}

interface InterviewInvitationEmailProps {
  match: Match;
  jobTitle: string;
  companyName: string;
  interviewDetails: InterviewDetails;
}

export function InterviewInvitationEmail({
  match,
  jobTitle,
  companyName,
  interviewDetails,
}: InterviewInvitationEmailProps) {
  const formattedDate = format(new Date(interviewDetails.date), "EEEE, MMMM d, yyyy");
  const formattedTime = format(new Date(`1970-01-01T${interviewDetails.time}`), "h:mm a");

  return (
    <Html>
      <Head />
      <Preview>Interview Invitation: {jobTitle} position at {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>{companyName}</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Interview Invitation 🎯</Heading>

            <Text style={text}>Dear {match.candidate.name},</Text>

            <Text style={text}>
              Thank you for your interest in the <strong>{jobTitle}</strong> position at {companyName}.
              We were impressed by your profile and would like to invite you for an interview.
            </Text>

            {/* Interview Details Card */}
            <Section style={detailsCard}>
              <Text style={detailsTitle}>Interview Details</Text>

              <div style={detailsGrid}>
                <div style={detailsRow}>
                  <Text style={detailsLabel}>Type:</Text>
                  <Text style={detailsValue}>
                    {interviewDetails.type === "ONLINE" ? "Online Meeting" : "In-Person Interview"}
                  </Text>
                </div>

                <div style={detailsRow}>
                  <Text style={detailsLabel}>Date:</Text>
                  <Text style={detailsValue}>{formattedDate}</Text>
                </div>

                <div style={detailsRow}>
                  <Text style={detailsLabel}>Time:</Text>
                  <Text style={detailsValue}>{formattedTime}</Text>
                </div>

                {interviewDetails.type === "IN_PERSON" && (
                  <div style={detailsRow}>
                    <Text style={detailsLabel}>Location:</Text>
                    <Text style={detailsValue}>{interviewDetails.location}</Text>
                  </div>
                )}

                {interviewDetails.type === "ONLINE" && interviewDetails.meetLink && (
                  <div style={detailsRow}>
                    <Text style={detailsLabel}>Meeting Link:</Text>
                    <Button href={interviewDetails.meetLink} style={meetingButton}>
                      Join Meeting
                    </Button>
                  </div>
                )}
              </div>
            </Section>

            <Text style={text}>
              Please confirm your attendance by clicking the button below or replying to this email.
              If you need to reschedule or have any questions, please don&apos;t hesitate to contact us.
            </Text>

            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL}/interviews/confirm/${match.id}`}
              style={button}
            >
              Confirm Attendance
            </Button>

            <Hr style={divider} />

            <Text style={footer}>
              Best regards,
              <br />
              The {companyName} Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles using our color system
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const header = {
  backgroundColor: "#00a383",
  padding: "24px",
  borderRadius: "8px 8px 0 0",
};

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "32px",
  borderRadius: "0 0 8px 8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.1",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const detailsCard = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailsTitle = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const detailsGrid = {
  display: "grid",
  gap: "16px",
};

const detailsRow = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  alignItems: "center",
  gap: "16px",
};

const detailsLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const detailsValue = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const meetingButton = {
  backgroundColor: "#00a383",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  padding: "8px 12px",
  textAlign: "center" as const,
  display: "inline-block",
};

const button = {
  backgroundColor: "#00a383",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "32px auto",
  width: "fit-content",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};
