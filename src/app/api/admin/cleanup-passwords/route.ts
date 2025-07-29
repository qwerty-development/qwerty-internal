import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredPasswords } from "@/utils/passwordService";

export async function POST(request: NextRequest) {
  try {
    console.log("Admin API: Starting password cleanup...");

    const success = await cleanupExpiredPasswords();

    if (success) {
      console.log("Admin API: Password cleanup completed successfully");
      return NextResponse.json({
        success: true,
        message: "Expired passwords cleaned up successfully",
      });
    } else {
      console.error("Admin API: Password cleanup failed");
      return NextResponse.json(
        {
          success: false,
          error: "Failed to clean up expired passwords",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Password cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
