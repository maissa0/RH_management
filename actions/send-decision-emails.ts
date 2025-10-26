"use server";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { AcceptanceEmail } from "@/components/emails/acceptance-email";
import { RejectionEmail } from "@/components/emails/rejection-email";

interface SendDecisionEmailProps {
  matchId: string;
  postId: string;
  isAccepted: boolean;
  additionalNotes?: string;
}

export async function sendDecisionEmail({
  matchId,
  postId,
  isAccepted,
  additionalNotes,
}: SendDecisionEmailProps) {
  try {
    const user = await getCurrentUser();
    if (!user?.organizationId) {
      throw new Error("Unauthorized");
    }

    // Get the job post details
    const post = await prisma.jobPost.findUnique({
      where: {
        id: postId,
        organizationId: user.organizationId,
        archivedAt: null,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new Error("Job post not found");
    }

    // Get match with candidate details
    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
        postId: postId,
        post: {
          organizationId: user.organizationId,
          archivedAt: null,
          deletedAt: null,
        },
        candidate: {
          archivedAt: null,
          deletedAt: null,
        },
      },
      include: {
        candidate: true,
      },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST!,
      port: parseInt(process.env.EMAIL_SERVER_PORT!),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    try {
      // Render the appropriate email template
      const emailHtml = await render(
        isAccepted
          ? AcceptanceEmail({
              match,
              jobTitle: post.title,
              companyName: post.companyName,
              additionalNotes,
            })
          : RejectionEmail({
              match,
              jobTitle: post.title,
              companyName: post.companyName,
            })
      );

      const subject = isAccepted
        ? `Congratulations! Your application for ${post.title} at ${post.companyName} has been accepted`
        : `Update on your application for ${post.title} at ${post.companyName}`;

      // Send the email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: match.candidate.email,
        subject,
        html: emailHtml,
      });

      // Update match with email details
      await prisma.match.update({
        where: { id: match.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
          emailSubject: subject,
          status: isAccepted ? "HIRED" : "REJECTED",
        },
      });

      return {
        success: true,
        message: `Successfully sent ${isAccepted ? "acceptance" : "rejection"} email to ${match.candidate.name}`,
      };
    } catch (error) {
      console.error(`Failed to send email for match ${match.id}:`, error);
      return {
        success: false,
        message: `Failed to send email to ${match.candidate.name}`,
        error,
      };
    }
  } catch (error) {
    console.error("Failed to send decision email:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send decision email",
    };
  }
} 