import connectDB from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Vendor from "@/app/lib/models/vendor";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/vendors/[id] - Get single vendor
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor ID format",
        },
        { status: 400 }
      );
    }

    const vendor = await Vendor.findById(id).select("-__v").lean();

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vendor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/[id] - Update vendor
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vendor ID format",
        },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await Vendor.findById(id);

    if (!existingVendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 }
      );
    }

    // Check if email is being changed to another existing vendor's email
    if (body.email && body.email !== existingVendor.email) {
      const emailExists = await Vendor.findOne({
        email: body.email.toLowerCase(),
        _id: { $ne: id }, // Exclude current vendor
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already belongs to another vendor",
          },
          { status: 409 }
        );
      }
    }

    // Update vendor
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined)
      updateData.email = body.email.toLowerCase().trim();
    if (body.contactPerson !== undefined)
      updateData.contactPerson = body.contactPerson?.trim();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim();
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.isActive !== undefined) updateData.isActive = body.isActiv;

    const updatedVendor = await Vendor.findByIdAndUpdate(id, updateData, {
      new: true, // return updated document
      runValidators: true, // run schema validation
    }).select("-__v");

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      data: updatedVendor.toObject(),
    });
  } catch (error) {
    console.error("Error updating vendor:", error);

    // Handle Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
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
        message: "Failed to update vendor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
