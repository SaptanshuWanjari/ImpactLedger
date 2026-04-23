import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/server/data";

const BUCKET = process.env.SUPABASE_RECEIPTS_BUCKET || "donation-receipts";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: donationId } = await params;

    if (!donationId) {
      return NextResponse.json({ error: "Donation ID is required." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("screenshot") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No screenshot file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5 MB." },
        { status: 400 },
      );
    }

    const tenantId = await getTenantId();
    const supabase = createAdminClient() as any;

    // Verify the donation exists and belongs to this tenant
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("id, status, payment_method")
      .eq("id", donationId)
      .eq("tenant_id", tenantId)
      .single();

    if (donationError || !donation) {
      return NextResponse.json({ error: "Donation not found." }, { status: 404 });
    }

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `screenshots/${tenantId}/${donationId}.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const screenshotUrl = publicUrlData?.publicUrl as string;

    // Update the donation record
    const { error: updateError } = await supabase
      .from("donations")
      .update({ payment_screenshot_url: screenshotUrl })
      .eq("id", donationId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ screenshotUrl }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
