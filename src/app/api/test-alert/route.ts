import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Twilio } from "twilio";

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has a phone number
    const userPhone = user.phone;
    if (!userPhone) {
      return NextResponse.json(
        { error: "No phone number on account" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build the test SMS message
    const smsMessage = `[TEST] MigrAlert:\n\n${message}\n\nThis is a test. Your alert setup is working!`;

    // Send SMS to user's own phone
    try {
      await twilioClient.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: userPhone,
      });

      // Save to alert history
      await supabase.from("alert_history").insert({
        user_id: user.id,
        message,
        is_test: true,
        contacts_notified: 0,
        latitude: null,
        longitude: null,
      });

      return NextResponse.json({
        success: true,
        message: "Test alert sent to your phone",
      });
    } catch (error) {
      console.error("Failed to send test SMS:", error);
      return NextResponse.json(
        { error: "Failed to send test message" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
