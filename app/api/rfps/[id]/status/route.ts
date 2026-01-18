import RFP from "@/app/lib/models/rfp";
import connectDB from "@/app/lib/mongodb";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

// PATCH /api/rfps/[id]/status - Update RFP status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const { status } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid RFP ID format",
        },
        { status: 400 }
      );
    }

    if (
      !status ||
      !["draft", "sent", "in_progress", "closed"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid status is required: draft, sent, in_progress, or closed",
        },
        { status: 400 }
      );
    }

    const rfp = await RFP.findById(id);
    if (!rfp) {
      return NextResponse.json(
        {
          success: false,
          message: "RFP not found",
        },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["sent", "closed"],
      sent: ["in_progress", "closed"],
      in_progress: ["closed"],
      closed: [], // Once closed, cannot change
    };

    if (!validTransitions[rfp.status]?.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot change status from ${rfp.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // If marking as sent, ensure there are assigned vendors
    if (
      status === "sent" &&
      (!rfp.assignedVendors || rfp.assignedVendors.length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot send RFP without assigned vendors",
        },
        { status: 400 }
      );
    }

    rfp.status = status;
    await rfp.save();

    const updatedRFP = await RFP.findById(id)
      .populate("assignedVendors", "name email")
      .select("-__v");

    return NextResponse.json({
      success: true,
      message: `RFP status updated to ${status}`,
      data: updatedRFP,
    });
  } catch (error) {
    console.error("Error updating RFP status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update RFP status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
