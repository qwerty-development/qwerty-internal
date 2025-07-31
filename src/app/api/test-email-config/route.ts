import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;

    const config = {
      emailUser: emailUser ? "Set" : "Not set",
      emailPass: emailPass ? "Set" : "Not set",
      smtpHost: smtpHost || "smtp.gmail.com (default)",
      smtpPort: smtpPort || "587 (default)",
    };

    return NextResponse.json({
      success: true,
      config,
      message:
        emailUser && emailPass
          ? "Email configuration appears to be set up correctly"
          : "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS environment variables.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
