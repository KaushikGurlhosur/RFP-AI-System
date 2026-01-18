import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";

import mongoose from "mongoose";
import RFP from "@/app/lib/models/rfp";
import Vendor from "@/app/lib/models/vendor";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/rfps/[id] - Get single RFP with details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid RFP ID format",
        },
        { status: 400 }
      );
    }

    const rfp = await RFP.findById(id)
      .populate("assignedVendors", "name email contactPerson phone category")
      .populate({
        path: "proposals",
        select: "-__v",
        populate: {
          path: "vendorId",
          select: "name email",
        },
      })
      .select("-__v")
      .lean();

    if (!rfp) {
      return NextResponse.json(
        {
          success: false,
          message: "RFP not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rfp,
    });
  } catch (error) {
    console.error("Error fetching RFP:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch RFP",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/rfps/[id] - Update RFP
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid RFP ID format",
        },
        { status: 400 }
      );
    }

    const existingRFP = await RFP.findById(id);
    if (!existingRFP) {
      return NextResponse.json(
        {
          success: false,
          message: "RFP not found",
        },
        { status: 404 }
      );
    }

    // Validate vendor IDs if being updated
    if (body.assignedVendors && Array.isArray(body.assignedVendors)) {
      const validVendors = await Vendor.find({
        _id: { $in: body.assignedVendors },
        isActive: true,
      }).select("_id");

      const validVendorIds = validVendors.map((v) => v._id.toString());
      const invalidVendorIds = body.assignedVendors.filter(
        (vendorId: string) => !validVendorIds.includes(vendorId)
      );

      if (invalidVendorIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Some vendor IDs are invalid or inactive",
            invalidVendorIds,
          },
          { status: 400 }
        );
      }
    }

    // Update RFP
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description.trim();
    if (body.structuredData !== undefined)
      updateData.structuredData = body.structuredData;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.deadline !== undefined)
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.terms !== undefined) updateData.terms = body.terms;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedVendors !== undefined)
      updateData.assignedVendors = body.assignedVendors;

    const updatedRFP = await RFP.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignedVendors", "name email")
      .select("-__v");

    return NextResponse.json({
      success: true,
      message: "RFP updated successfully",
      data: updatedRFP,
    });
  } catch (error) {
    console.error("Error updating RFP:", error);

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
        message: "Failed to update RFP",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rfps/[id] - Delete RFP (only if draft)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid RFP ID format",
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

    // Only allow deletion of draft RFPs
    if (rfp.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          message: "Only draft RFPs can be deleted",
        },
        { status: 400 }
      );
    }

    await RFP.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "RFP deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting RFP:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete RFP",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
