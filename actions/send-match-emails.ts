"use server";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { InterviewInvitationEmail } from "@/components/emails/match-notification";

interface InterviewDetails {
  type: "ONLINE" | "IN_PERSON";
  date: Date;
  time: string;
  location?: string;
  meetLink?: string;
}

interface SendMatchEmailsProps {
  matchIds: string[];
  postId: string;
  interviewDetails: InterviewDetails;
}

export async function sendMatchEmails({
  matchIds,
  postId,
  interviewDetails,
}: SendMatchEmailsProps) {
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

    // Get all matches with candidate details
    const matches = await prisma.match.findMany({
      where: {
        id: { in: matchIds },
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

    // Send emails to all matches
    const emailPromises = matches.map(async (match) => {
      try {
        // Await the render call to get the HTML string
        const emailHtml = await render(
          InterviewInvitationEmail({
            match,
            jobTitle: post.title,
            companyName: post.companyName,
            interviewDetails,
          }),
        );

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: match.candidate.email,
          subject: `Interview Invitation: ${post.title} position at ${post.companyName}`,
          html: emailHtml,
        });

        // Update match with interview details and set status to CONTACTED
        await prisma.match.update({
          where: { id: match.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
            status: "CONTACTED",
            emailSubject: `Interview Invitation: ${post.title} position at ${post.companyName}`,
            interviewDetails: interviewDetails as any,
          },
        });

        return { success: true, matchId: match.id };
      } catch (error) {
        console.error(`Failed to send email for match ${match.id}:`, error);
        return { success: false, matchId: match.id, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    return {
      success: true,
      message: `Successfully sent ${successCount} out of ${matches.length} interview invitations`,
      results,
    };
  } catch (error) {
    console.error("Failed to send interview invitations:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send interview invitations",
    };
  }
}
