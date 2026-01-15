import Vendor from "@/app/lib/models/vendor";
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

    let query: any = {};

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
