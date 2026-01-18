import mongoose, { Document, Schema } from "mongoose";

export interface IRFPItem {
  name: string;
  quantity: number;
  specifications: Record<string, any>;
}

export interface IRFPTerms {
  payment: string;
  warranty: string;
  delivery: string;
  other?: Record<string, any>;
}

export interface IRFP extends Document {
  title: string;
  description: string; // Natural language input
  structuredData: {
    extractedItems: IRFPItem[];
    extractedTerms: IRFPTerms;
    budget?: number;
    deadline?: string;
    otherDetails?: Record<string, any>;
  };
  budget?: number;
  deadline?: Date;
  items: IRFPItem[];
  terms: IRFPTerms;
  status: "draft" | "sent" | "in_progress" | "closed";
  createdBy: string; // Could be user ID, for now use email or name
  assignedVendors: mongoose.Types.ObjectId[]; // Vendor IDs
  createdAt: Date;
  updatedAt: Date;
}

const RFPItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const RFPTermsSchema = new Schema(
  {
    payment: {
      type: String,
      required: true,
      default: "Net 30",
    },
    warranty: {
      type: String,
      required: true,
      default: "1 year",
    },
    delivery: {
      type: String,
      required: true,
      default: "Within 30 days",
    },
    other: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const RFPSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "RFP title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
    },
    structuredData: {
      extractedItems: {
        type: [RFPItemSchema],
        default: [],
      },
      extractedTerms: {
        type: RFPTermsSchema,
        required: true,
      },
      budget: {
        type: Number,
        min: [0, "Budget cannot be negative"],
      },
      deadline: {
        type: String,
      },
      otherDetails: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    deadline: {
      type: Date,
    },
    items: {
      type: [RFPItemSchema],
      default: [],
    },
    terms: {
      type: RFPTermsSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "in_progress", "closed"],
      default: "draft",
    },
    createdBy: {
      type: String,
      required: true,
      default: "admin@example.com",
    },
    assignedVendors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
RFPSchema.index({ status: 1 });
RFPSchema.index({ createdAt: -1 });
RFPSchema.index({ assignedVendors: 1 });

// Virtual for vendor count
RFPSchema.virtual("vendorCount").get(function () {
  return this.assignedVendors?.length || 0;
});

// Virtual for proposals (we'll populate this later)
RFPSchema.virtual("proposals", {
  ref: "Proposal",
  localField: "_id",
  foreignField: "rfpId",
});

const RFP = mongoose.models.RFP || mongoose.model<IRFP>("RFP", RFPSchema);

export default RFP;
