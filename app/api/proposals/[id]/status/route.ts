import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";

import mongoose from "mongoose";
import Proposal from "@/app/lib/models/proposal";

interface Params {
  params: {
    id: string;
  };
}

// PATCH /api/proposals/[id]/status - Update proposal status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const { status, evaluatorNotes } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid proposal ID format",
        },
        { status: 400 }
      );
    }

    if (
      !status ||
      !["pending", "received", "evaluated", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid status is required: pending, received, evaluated, or rejected",
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

    // Update status
    proposal.status = status;

    // Add evaluator notes if provided
    if (evaluatorNotes) {
      proposal.evaluatorNotes = evaluatorNotes;
    }

    // If marking as evaluated and not already evaluated, set evaluatedAt
    if (status === "evaluated" && !proposal.evaluatedAt) {
      proposal.evaluatedAt = new Date();
    }

    await proposal.save();

    const updatedProposal = await Proposal.findById(id)
      .populate("vendorId", "name email")
      .populate("rfpId", "title")
      .select("-__v -rawEmailContent");

    return NextResponse.json({
      success: true,
      message: `Proposal status updated to ${status}`,
      data: updatedProposal,
    });
  } catch (error) {
    console.error("Error updating proposal status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update proposal status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
