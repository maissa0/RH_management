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
import { Match } from "@/types";

interface AcceptanceEmailProps {
  match: Match;
  jobTitle: string;
  companyName: string;
  additionalNotes?: string;
}

export function AcceptanceEmail({
  match,
  jobTitle,
  companyName,
  additionalNotes,
}: AcceptanceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Congratulations! Your application for {jobTitle} at {companyName} has been accepted</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>{companyName}</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Congratulations! 🎉</Heading>

            <Text style={text}>Dear {match.candidate.name},</Text>

            <Text style={text}>
              We are pleased to inform you that your application for the <strong>{jobTitle}</strong> position at {companyName} has been accepted.
              We were impressed by your qualifications and experience, and we believe you will be a valuable addition to our team.
            </Text>

            {additionalNotes && (
              <Section style={detailsCard}>
                <Text style={detailsTitle}>Additional Information</Text>
                <Text style={text}>{additionalNotes}</Text>
              </Section>
            )}

            <Text style={text}>
              Our HR team will be in touch with you shortly to discuss the next steps, including paperwork, start date, and onboarding details.
              If you have any questions in the meantime, please don&apos;t hesitate to contact us.
            </Text>

            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL}/candidates/confirm-acceptance/${match.id}`}
              style={button}
            >
              Confirm Acceptance
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

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
};

const header = {
  padding: "20px",
  borderBottom: "1px solid #e6ebf1",
};

const logo = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#333",
  textDecoration: "none",
};

const content = {
  padding: "20px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  lineHeight: "1.5",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const detailsCard = {
  backgroundColor: "#f9f9f9",
  border: "1px solid #e6ebf1",
  borderRadius: "5px",
  padding: "15px",
  margin: "20px 0",
};

const detailsTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const button = {
  backgroundColor: "#22c55e",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "20px 0",
  padding: "12px 20px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const divider = {
  borderTop: "1px solid #e6ebf1",
  margin: "30px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "1.5",
}; 