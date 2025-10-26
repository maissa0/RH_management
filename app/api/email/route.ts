import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { candidateEmail, meetingTitle, meetingDate, meetingTime, meetingLink } = await request.json();

    const formattedDate = new Date(meetingDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailContent = `
      <h2>Meeting Invitation</h2>
      <p>You have been invited to: <strong>${meetingTitle}</strong></p>
      <p>Date: ${formattedDate}</p>
      <p>Time: ${meetingTime}</p>
      ${meetingLink ? `<p>Meeting Link: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: candidateEmail,
      subject: `Meeting Invitation: ${meetingTitle}`,
      html: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}