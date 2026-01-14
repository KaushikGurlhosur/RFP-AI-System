export interface Proposal {
  _id?: string;
  rfpId: string;
  vendorId: string;
  status: "pending" | "received" | "evaluated" | "rejected";
  rawContent?: string;
  attachments: string[];
  extractedData: Record<string, any>;
  totalPrice?: number;
  deliveryDays?: number;
  warranty?: string;
  paymentTerms?: string;
  aiScore?: number;
  aiSummary?: string;
  aiAnalysis?: Record<string, any>;
  receivedAt?: Date;
  createdAt: Date;
}
