export interface Vendor {
  _id?: string;
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  category: string[];
  notes?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateVendorInput {
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  category?: string[];
  notes?: string;
}
