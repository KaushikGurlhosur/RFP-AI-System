export interface RFPItem {
  name: string;
  quantity: number;
  specifications: Record<string, any>;
}

export interface RFPTerms {
  payment: string;
  warranty: string;
  delivery: string;
  other?: Record<string, any>;
}

export interface RFP {
  _id?: string;
  title: string;
  description: string; // Natural language input
  structuredData: Record<string, any>;
  budget?: number;
  deadline?: Date;
  items: RFPItem[];
  terms: RFPTerms;
  status: "draft" | "sent" | "in_progress" | "closed";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRFPInput {
  title: string;
  description: string;
  budget?: number;
  deadline?: Date;
}
