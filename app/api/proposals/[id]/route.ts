import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";

import mongoose from "mongoose";
import Proposal from "@/app/lib/models/proposal";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/proposals/[id] - Get single proposal with full details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid proposal ID format",
        },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findById(id)
      .populate("vendorId", "name email contactPerson phone category rating")
      .populate("rfpId", "title description budget deadline items terms")
      .select("-__v")
      .lean();

    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          message: "Proposal not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/proposals/[id] - Update proposal
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid proposal ID format",
        },
        { status: 400 }
      );
    }

    const existingProposal = await Proposal.findById(id);
    if (!existingProposal) {
      return NextResponse.json(
        {
          success: false,
          message: "Proposal not found",
        },
        { status: 404 }
      );
    }

    // Update allowed fields
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.extractedData !== undefined)
      updateData.extractedData = body.extractedData;
    if (body.aiAnalysis !== undefined) updateData.aiAnalysis = body.aiAnalysis;
    if (body.evaluatorNotes !== undefined)
      updateData.evaluatorNotes = body.evaluatorNotes;

    // If updating extracted data, also trigger AI re-analysis
    if (body.extractedData && Object.keys(body.extractedData).length > 0) {
      updateData["aiAnalysis.lastUpdated"] = new Date();
    }

    const updatedProposal = await Proposal.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("vendorId", "name email")
      .populate("rfpId", "title")
      .select("-__v -rawEmailContent");

    return NextResponse.json({
      success: true,
      message: "Proposal updated successfully",
      data: updatedProposal,
    });
  } catch (error) {
    console.error("Error updating proposal:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
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
        message: "Failed to update proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/proposals/[id] - Delete proposal
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid proposal ID format",
        },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          message: "Proposal not found",
        },
        { status: 404 }
      );
    }

    await Proposal.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Proposal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete proposal",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
