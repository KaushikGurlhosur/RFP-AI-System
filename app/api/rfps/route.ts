import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";

import mongoose from "mongoose";
import RFP from "@/app/lib/models/rfp";
import Vendor from "@/app/lib/models/vendor";

// GET /api/rfps - Get all RFPs with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await RFP.countDocuments(query);

    // Get RFPs with pagination
    const rfps = await RFP.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("assignedVendors", "name email")
      .select("-__v")
      .lean();

    return NextResponse.json({
      success: true,
      data: rfps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch RFPs",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/rfps - Create a new RFP
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Basic validation
    if (!body.title || !body.description) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and description are required",
        },
        { status: 400 }
      );
    }

    // Create RFP data
    const rfpData = {
      title: body.title.trim(),
      description: body.description.trim(),
      structuredData: body.structuredData || {
        extractedItems: [],
        extractedTerms: {
          payment: "Net 30",
          warranty: "1 year",
          delivery: "Within 30 days",
          other: {},
        },
      },
      budget: body.budget,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      items: body.items || [],
      terms: body.terms || {
        payment: "Net 30",
        warranty: "1 year",
        delivery: "Within 30 days",
        other: {},
      },
      status: body.status || "draft",
      createdBy: body.createdBy || "admin@example.com",
      assignedVendors: body.assignedVendors || [],
    };

    // Validate vendor IDs if provided
    if (rfpData.assignedVendors.length > 0) {
      const validVendors = await Vendor.find({
        _id: { $in: rfpData.assignedVendors },
        isActive: true,
      }).select("_id");

      const validVendorIds = validVendors.map((v) => v._id.toString());
      const invalidVendorIds = rfpData.assignedVendors.filter(
        (id: string) => !validVendorIds.includes(id)
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

    const rfp = await RFP.create(rfpData);

    // Populate vendor details in response
    const populatedRFP = await RFP.findById(rfp._id)
      .populate("assignedVendors", "name email")
      .select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "RFP created successfully",
        data: populatedRFP,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating RFP:", error);

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
        message: "Failed to create RFP",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
