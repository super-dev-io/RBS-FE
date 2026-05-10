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

export type AiProviderName = "openai" | "anthropic";

export const AI_MODELS = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-7"],
} as const satisfies Record<AiProviderName, readonly string[]>;

export interface BidderProfileSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  linkedinUrl?: string | null;
  address?: string | null;
  defaultPdfTemplateId?: string | null;
  defaultPdfTemplate?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile extends BidderProfileSummary {
  masterPrompt: string;
  aiProvider?: AiProviderName | null;
  aiModel?: string | null;
  createdByAdminId: string;
  _count?: { assignments: number; generations: number };
  assignments?: Array<{
    bidder: { id: string; name: string; email: string; isActive: boolean };
  }>;
}

export type BlockKind =
  | "header"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications";

export interface BlockConfig {
  kind: BlockKind;
  enabled: boolean;
  order: number;
}

export type FontFamily = "Inter" | "Lora" | "Source Sans" | "Playfair";
export type Density = "compact" | "normal" | "relaxed";
export type Layout = "one-col" | "two-col";

export interface ThemeConfig {
  fontFamily: FontFamily;
  accentColor: string;
  baseFontSize: number;
  density: Density;
  layout: Layout;
}

export interface TemplateConfig {
  blocks: BlockConfig[];
  theme: ThemeConfig;
}

export const ALL_BLOCK_KINDS: BlockKind[] = [
  "header",
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
];

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  blocks: ALL_BLOCK_KINDS.map((kind, i) => ({ kind, enabled: true, order: i })),
  theme: {
    fontFamily: "Inter",
    accentColor: "#2563eb",
    baseFontSize: 11,
    density: "normal",
    layout: "one-col",
  },
};

export interface ResumeTemplate {
  id: string;
  name: string;
  description?: string | null;
  config: TemplateConfig;
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
