import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Test API endpoint working",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Test POST endpoint working",
    timestamp: new Date().toISOString(),
  });
}
