import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";

import mongoose from "mongoose";
import Proposal from "@/app/lib/models/proposal";
import RFP from "@/app/lib/models/rfp";
import Vendor from "@/app/lib/models/vendor";

// GET /api/proposals - Get all proposals with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const rfpId = searchParams.get("rfpId");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    if (rfpId && mongoose.Types.ObjectId.isValid(rfpId)) {
      query.rfpId = new mongoose.Types.ObjectId(rfpId);
    }

    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(vendorId);
    }

    if (status && status !== "all") {
      query.status = status;
    }

    // Get total count for pagination
    const total = await Proposal.countDocuments(query);

    // Get proposals with population
    const proposals = await Proposal.find(query)
      .sort({ "aiAnalysis.score": -1, receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("vendorId", "name email contactPerson")
      .populate("rfpId", "title status")
      .select("-__v -rawEmailContent")
      .lean();

    return NextResponse.json({
      success: true,
      data: proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch proposals",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Create/register a proposal (manual or via email webhook)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Basic validation
    if (!body.rfpId || !body.vendorId) {
      return NextResponse.json(
        {
          success: false,
          message: "RFP ID and Vendor ID are required",
        },
        { status: 400 }
      );
    }

    // Validate RFP exists and is active
    const rfp = await RFP.findById(body.rfpId);
    if (!rfp) {
      return NextResponse.json(
        {
          success: false,
          message: "RFP not found",
        },
        { status: 404 }
      );
    }

    // Check if vendor is assigned to this RFP
    const isVendorAssigned = rfp.assignedVendors.some(
      (vendorId: mongoose.Types.ObjectId) =>
        vendorId.toString() === body.vendorId
    );

    if (!isVendorAssigned) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor is not assigned to this RFP",
        },
        { status: 400 }
      );
    }

    // Validate vendor exists and is active
    const vendor = await Vendor.findOne({
      _id: body.vendorId,
      isActive: true,
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found or inactive",
        },
        { status: 404 }
      );
    }

    // Check if proposal already exists for this RFP and vendor
    const existingProposal = await Proposal.findOne({
      rfpId: body.rfpId,
      vendorId: body.vendorId,
    });

    if (existingProposal) {
      return NextResponse.json(
        {
          success: false,
          message: "Proposal already exists for this vendor and RFP",
          data: existingProposal,
        },
        { status: 409 }
      );
    }

    // Create proposal data
    const proposalData = {
      rfpId: body.rfpId,
      vendorId: body.vendorId,
      status: body.rawEmailContent ? "received" : "pending",
      rawEmailContent: body.rawEmailContent || "Manually created proposal",
      rawAttachments: body.rawAttachments || [],
      extractedData: body.extractedData || {
        totalPrice: 0,
        deliveryDays: 30,
        warranty: "Not specified",
        paymentTerms: "Not specified",
        specifications: {},
        notes: "",
        complianceScore: 0,
      },
      aiAnalysis: body.aiAnalysis || {
        score: 0,
        summary: "",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        comparisonData: {},
      },
      evaluatorNotes: body.evaluatorNotes,
    };

    const proposal = await Proposal.create(proposalData);

    // Update RFP status if this is the first proposal
    if (rfp.status === "sent") {
      await RFP.findByIdAndUpdate(body.rfpId, { status: "in_progress" });
    }

    // Populate response
    const populatedProposal = await Proposal.findById(proposal._id)
      .populate("vendorId", "name email contactPerson")
      .populate("rfpId", "title")
      .select("-__v -rawEmailContent");

    return NextResponse.json(
      {
        success: true,
        message: "Proposal created successfully",
        data: populatedProposal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating proposal:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Proposal already exists for this vendor and RFP",
        },
        { status: 409 }
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
