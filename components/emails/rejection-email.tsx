import {
  Body,
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

interface RejectionEmailProps {
  match: Match;
  jobTitle: string;
  companyName: string;
}

export function RejectionEmail({
  match,
  jobTitle,
  companyName,
}: RejectionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your application for {jobTitle} at {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>{companyName}</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Application Update</Heading>

            <Text style={text}>Dear {match.candidate.name},</Text>

            <Text style={text}>
              Thank you for your interest in the <strong>{jobTitle}</strong> position at {companyName} and for taking the time to go through our application process.
            </Text>

            <Text style={text}>
              After careful consideration of all applications, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely align with our current needs.
            </Text>

            <Text style={text}>
              We appreciate your interest in joining our team and encourage you to apply for future positions that match your skills and experience. We will keep your application on file for consideration should a suitable role become available.
            </Text>

            <Text style={text}>
              We wish you the best in your job search and future career endeavors.
            </Text>

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

const divider = {
  borderTop: "1px solid #e6ebf1",
  margin: "30px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "1.5",
}; 