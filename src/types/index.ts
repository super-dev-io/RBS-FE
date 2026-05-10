export type Role = "ADMIN" | "BIDDER";
export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Bidder {
  id: string;
  email: string;
  name: string;
  role: "BIDDER";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  assignments?: Array<{ profile: { id: string; fullName: string; email: string } }>;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  linkedinUrl?: string | null;
  address?: string | null;
  masterPrompt: string;
  defaultPdfTemplateId?: string | null;
  defaultPdfTemplate?: { id: string; name: string } | null;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { assignments: number; generations: number };
  assignments?: Array<{
    bidder: { id: string; name: string; email: string; isActive: boolean };
  }>;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description?: string | null;
  htmlTemplate: string;
  cssStyles: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeGeneration {
  id: string;
  bidderId: string;
  profileId: string;
  templateId: string;
  companyName: string;
  roleTitle: string;
  jobDescription: string;
  status: GenerationStatus;
  aiProvider?: string | null;
  aiModel?: string | null;
  generatedContent?: any;
  pdfPath?: string | null;
  pdfUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  profile?: { id: string; fullName: string; email?: string };
  template?: { id: string; name: string };
  bidder?: { id: string; name: string; email: string };
}

export interface WorkLog {
  id: string;
  bidderId: string;
  profileId: string;
  companyName: string;
  roleTitle: string;
  generationStatus: GenerationStatus;
  generatedResumeId?: string | null;
  createdAt: string;
  completedAt?: string | null;
  bidder?: { id: string; name: string; email: string };
  profile?: { id: string; fullName: string };
  generatedResume?: { id: string; pdfUrl?: string | null; status: GenerationStatus } | null;
}
