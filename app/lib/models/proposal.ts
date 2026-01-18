import mongoose, { Document, Schema } from "mongoose";

export interface IProposal extends Document {
  rfpId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  status: "pending" | "received" | "evaluated" | "rejected";

  // Raw content from email
  rawEmailContent: string;
  rawAttachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }>;

  // AI-extracted structured data
  extractedData: {
    totalPrice: number;
    deliveryDays: number;
    warranty: string;
    paymentTerms: string;
    specifications?: Record<string, any>;
    notes?: string;
    complianceScore?: number; // 0-100 how well it matches RFP requirements
  };

  // AI analysis
  aiAnalysis: {
    score: number; // 0-100 overall score
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    comparisonData?: Record<string, any>;
  };

  // Metadata
  receivedAt: Date;
  evaluatedAt?: Date;
  evaluatorNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema: Schema = new Schema(
  {
    rfpId: {
      type: Schema.Types.ObjectId,
      ref: "RFP",
      required: [true, "RFP ID is required"],
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "received", "evaluated", "rejected"],
      default: "pending",
      index: true,
    },

    // Raw email data
    rawEmailContent: {
      type: String,
      required: [true, "Email content is required"],
    },
    rawAttachments: [
      {
        filename: String,
        contentType: String,
        size: Number,
        url: String,
      },
    ],

    // Extracted data
    extractedData: {
      totalPrice: {
        type: Number,
        min: [0, "Price cannot be negative"],
        default: 0,
      },
      deliveryDays: {
        type: Number,
        min: [0, "Delivery days cannot be negative"],
        default: 30,
      },
      warranty: {
        type: String,
        default: "Not specified",
      },
      paymentTerms: {
        type: String,
        default: "Not specified",
      },
      specifications: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
      notes: {
        type: String,
        default: "",
      },
      complianceScore: {
        type: Number,
        min: [0, "Score cannot be negative"],
        max: [100, "Score cannot exceed 100"],
        default: 0,
      },
    },

    // AI analysis
    aiAnalysis: {
      score: {
        type: Number,
        min: [0, "Score cannot be negative"],
        max: [100, "Score cannot exceed 100"],
        default: 0,
      },
      summary: {
        type: String,
        default: "",
      },
      strengths: {
        type: [String],
        default: [],
      },
      weaknesses: {
        type: [String],
        default: [],
      },
      recommendations: {
        type: [String],
        default: [],
      },
      comparisonData: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
    },

    // Metadata
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    evaluatedAt: {
      type: Date,
    },
    evaluatorNotes: {
      type: String,
      maxlength: [1000, "Evaluator notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure one proposal per vendor per RFP
ProposalSchema.index({ rfpId: 1, vendorId: 1 }, { unique: true });

// Indexes for faster queries
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ "extractedData.totalPrice": 1 });
ProposalSchema.index({ "aiAnalysis.score": -1 });
ProposalSchema.index({ receivedAt: -1 });

const Proposal =
  mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);

export default Proposal;
