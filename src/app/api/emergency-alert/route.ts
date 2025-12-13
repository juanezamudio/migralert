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

    // Parse request body
    const body = await request.json();
    const { message, shareLocation, latitude, longitude, isTest } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get user's emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("contact_order", { ascending: true });

    if (contactsError) {
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: "No emergency contacts configured" },
        { status: 400 }
      );
    }

    // Build the SMS message
    let smsMessage = `EMERGENCY ALERT from MigrAlert:\n\n${message}`;

    if (shareLocation && latitude && longitude) {
      const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
      smsMessage += `\n\nLast known location:\n${mapsUrl}`;
    }

    // Send SMS to each contact
    const sendPromises = contacts.map(async (contact) => {
      try {
        await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: contact.phone,
        });
        return { phone: contact.phone, success: true };
      } catch (error) {
        console.error(`Failed to send SMS to ${contact.phone}:`, error);
        return {
          phone: contact.phone,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    });

    const results = await Promise.all(sendPromises);

    // Check if any messages were sent successfully
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    if (successCount === 0) {
      return NextResponse.json(
        { error: "Failed to send alert to any contacts", details: results },
        { status: 500 }
      );
    }

    // Save to alert history
    await supabase.from("alert_history").insert({
      user_id: user.id,
      message,
      is_test: isTest || false,
      contacts_notified: successCount,
      latitude: shareLocation ? latitude : null,
      longitude: shareLocation ? longitude : null,
    });

    return NextResponse.json({
      success: true,
      message: `Alert sent to ${successCount} contact(s)`,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error("Emergency alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
