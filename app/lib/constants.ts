export const RFP_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",
} as const;

export const PROPOSAL_STATUS = {
  PENDING: "pending",
  RECEIVED: "received",
  EVALUATED: "evaluated",
  REJECTED: "rejected",
} as const;

export const VENDOR_CATEGORIES = [
  "IT Equipment",
  "Office Supplies",
  "Software",
  "Services",
  "Furniture",
  "Consulting",
  "Other",
];

export const DEFAULT_RFP_TERMS = {
  payment: "Net 30",
  warranty: "1 year",
  delivery: "Within 30 days",
};
