import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Vendor from "@/app/lib/models/vendor";
import RFP from "@/app/lib/models/rfp";
import Proposal from "@/app/lib/models/proposal";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    console.log("Email webhook received:", {
      from: body.from,
      subject: body.subject,
      hasText: !!body.text,
      hasHtml: !!body.html,
    });

    // Extract email data
    const {
      from, // vendor email
      subject,
      text, // plain text content
      html, // HTML content
      attachments = [],
    } = body;

    if (!from) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing sender email (from field)",
        },
        { status: 400 }
      );
    }

    // Clean the email (remove whitespace, convert to lowercase)
    const cleanEmail = from.trim().toLowerCase();

    // Find vendor by email
    const vendor = await Vendor.findOne({
      email: cleanEmail,
      isActive: true,
    });

    if (!vendor) {
      console.log(`Vendor not found for email: ${cleanEmail}`);
      return NextResponse.json(
        {
          success: false,
          message: `Vendor not found or inactive for email: ${cleanEmail}`,
          suggestion: "Create a vendor with this email first",
          receivedEmail: cleanEmail,
        },
        { status: 404 }
      );
    }

    console.log(`Found vendor: ${vendor.name} (${vendor._id})`);

    // Try to find RFPs this vendor is assigned to
    const rfps = await RFP.find({
      assignedVendors: vendor._id,
      status: { $in: ["sent", "in_progress"] },
    }).sort({ createdAt: -1 });

    if (rfps.length === 0) {
      console.log(`No active RFPs found for vendor: ${vendor.name}`);
      return NextResponse.json(
        {
          success: false,
          message: "No active RFPs found for this vendor",
          suggestion: "Assign this vendor to an RFP and mark it as 'sent'",
          vendorName: vendor.name,
        },
        { status: 404 }
      );
    }

    // Use the most recent RFP
    const rfp = rfps[0];
    console.log(`Using RFP: ${rfp.title} (${rfp._id})`);

    // Check if proposal already exists
    const existingProposal = await Proposal.findOne({
      rfpId: rfp._id,
      vendorId: vendor._id,
    });

    const emailContent = text || html || "No content";

    if (existingProposal) {
      // Update existing proposal
      existingProposal.rawEmailContent = emailContent;
      existingProposal.rawAttachments = attachments.map((att: any) => ({
        filename: att.filename || "attachment",
        contentType: att.contentType || "application/octet-stream",
        size: att.size || 0,
        url: att.url || "",
      }));
      existingProposal.status = "received";
      existingProposal.receivedAt = new Date();

      await existingProposal.save();

      const updatedProposal = await Proposal.findById(existingProposal._id)
        .populate("vendorId", "name email")
        .populate("rfpId", "title")
        .select("-__v -rawEmailContent");

      return NextResponse.json({
        success: true,
        message: "Proposal updated from email",
        data: updatedProposal,
      });
    }

    // Create new proposal
    const proposalData = {
      rfpId: rfp._id,
      vendorId: vendor._id,
      status: "received",
      rawEmailContent: emailContent,
      rawAttachments: attachments.map((att: any) => ({
        filename: att.filename || "attachment",
        contentType: att.contentType || "application/octet-stream",
        size: att.size || 0,
        url: att.url || "",
      })),
      extractedData: {
        totalPrice: 0,
        deliveryDays: 30,
        warranty: "Not specified",
        paymentTerms: "Not specified",
        specifications: {},
        notes: "",
        complianceScore: 0,
      },
      aiAnalysis: {
        score: 0,
        summary: "",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        comparisonData: {},
      },
    };

    const proposal = await Proposal.create(proposalData);

    // Update RFP status if needed
    if (rfp.status === "sent") {
      await RFP.findByIdAndUpdate(rfp._id, { status: "in_progress" });
    }

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate("vendorId", "name email")
      .populate("rfpId", "title")
      .select("-__v -rawEmailContent");

    return NextResponse.json(
      {
        success: true,
        message: "Proposal created from email",
        data: populatedProposal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process email",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
