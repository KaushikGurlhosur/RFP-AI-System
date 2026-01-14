// Import our constants
import mongoose, { Document, Schema } from "mongoose";
import { VENDOR_CATEGORIES } from "../constants";

export interface IVendor extends Document {
  name: string;
  email: string;
  contactPerson?: string; // optional field
  phone?: string;
  category: string[];
  notes?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const VendorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Vendor name is required"], // Error message if name is missing
      trim: true,
      minlength: [2, "Vendor name must be atleast 2 characters"],
      maxlength: [100, "Vendor name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ], // Email validation regex
    },

    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, "Contact person name too long"],
    },

    phone: {
      type: String,
      trim: true,
      match: [
        // Simple phone validation
        /^[\+]?[1-9][\d]{0,15}$/,
        "Please enter a valid phone number",
      ],
    },

    category: {
      type: [String], // Array of strings
      required: [true, "At least one category is required"],
      enum: {
        values: VENDOR_CATEGORIES, // Only allow these values
        message: "{VALUE} is not a valid category",
      },
      default: ["Other"],
    },

    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at least 5"],
      default: 3,
    },

    isActive: {
      type: Boolean,
      default: true, // Vendors are active by default
    },
  },
  {
    // Schema options
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true }, // Include virtuals when converting to object
  }
);
