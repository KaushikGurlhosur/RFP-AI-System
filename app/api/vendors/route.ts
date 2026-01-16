import Vendor, { IVendor } from "@/app/lib/models/vendor";
import mongoose from "mongoose";
import connectDB from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") !== "false";
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const query: any = {};

    if (activeOnly) {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
      ];
    }

    const vendors = await Vendor.find(query)
      .sort({ name: 1 })
      .select("-__v") // Exclude version key
      .lean();

    return NextResponse.json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.log("Error fetching vendors:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vendors",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and email are required",
        },
        { status: 400 }
      );
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      email: body.email.toLowerCase(),
    });

    if (existingVendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor with this email already exists",
        },
        {
          status: 409,
        }
      );
    }

    // Create new vendor
    const vendorData: Partial<IVendor> = {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      contactPerson: body.contactPerson?.trim(),
      phone: body.phone?.trim(),
      category: body.category || ["Other"],
      notes: body.notes?.trim(),
      rating: body.rating || 3,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    const vendor = await Vendor.create(vendorData);

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully",
        data: vendor.toObject(),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating vendor:", error);

    // Handle Mongoose validation errors
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
        message: "Failed to create vendor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
