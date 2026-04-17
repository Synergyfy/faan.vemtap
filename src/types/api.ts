/**
 * FAAN VemTap API Types
 * Based on Version 1.0 of the API Reference
 */

// --- Global Enums ---

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  LOCATION_ADMIN = 'LOCATION_ADMIN',
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  USER = 'USER',
}

export enum TouchpointType {
  FEEDBACK = 'FEEDBACK',
  COMPLAINT = 'COMPLAINT',
  INCIDENT = 'INCIDENT',
}

export enum SubmissionStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ReportType {
  INCIDENT = 'INCIDENT',
  FEEDBACK = 'FEEDBACK',
  COMPLAINT = 'COMPLAINT',
  SUGGESTION = 'SUGGESTION',
}

export enum InternalReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TemplateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum TimeRange {
  TODAY = 'TODAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_1_YEAR = 'LAST_1_YEAR',
  CUSTOM = 'CUSTOM',
}

// --- Global Response Envelope ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  statusCode: number;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    error: string; // HTTP error name e.g. "Conflict"
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// --- Module: Auth ---

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
    location: {
      id: string;
      name: string;
      airportCode: string;
      city: string;
      organization: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    departmentId: string | null;
    locationId: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

// --- Module: Organizations ---

export interface Organization {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo: string | null;
  supportUrl: string | null;
  emailAlerts: boolean;
  smsAlerts: boolean;
  retentionDays: number;
  apiKey: string | null;
  webhookUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  locations?: Array<{
    id: string;
    name: string;
    code: string;
    airportCode: string;
    city: string;
    _count: {
      departments: number;
      touchpoints: number;
    };
  }>;
}

// --- Module: Locations ---

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  airportCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  departments?: Array<{
    id: string;
    name: string;
    code: string;
    _count: {
      users: number;
      touchpoints: number;
    };
  }>;
  _count?: {
    departments?: number;
    touchpoints: number;
    reports: number;
  };
}

// --- Module: Departments ---

export interface Department {
  id: string;
  locationId: string;
  name: string;
  code: string;
  responsibility: string | null;
  color: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    airportCode: string;
    city: string;
    organization?: Organization;
  };
  users?: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
  }>;
  _count?: {
    touchpoints: number;
  };
  staffCount?: number;
  touchpointCount?: number;
  activeIssueCount?: number;
}

// --- Module: Touchpoints ---

export interface FormField {
  id: string;
  type: 'text' | 'dropdown' | 'file' | 'date' | 'rating' | 'textarea' | 'email' | 'number';
  label: string;
  name?: string;
  required?: boolean;
  options?: string[];
  maxRating?: number;
}

export interface Touchpoint {
  id: string;
  uuid: string;
  locationId: string;
  departmentId: string;
  createdById: string;
  title: string;
  description: string | null;
  type: TouchpointType;
  slug: string;
  formConfig: FormField[];
  isActive: boolean;
  interactions: number;
  createdAt: string;
  updatedAt: string;
  location?: { id: string; name: string; airportCode: string; city: string; };
  department?: { id: string; name: string; code: string; };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// --- Module: Submissions ---

export interface Submission {
  id: string; // Submission Code e.g. "SUB-8812"
  uuid: string; // The actual UUID
  touchpointId: string;
  locationId: string;
  departmentId: string | null;
  userId: string | null;
  status: SubmissionStatus;
  priority: Priority;
  type: TouchpointType; // Derived from touchpoint
  formData: Record<string, any>;
  submittedAt: string;
  createdAt: string;
  location?: string | { id: string; name: string; airportCode: string; city: string; };
  department?: string | { id: string; name: string; code: string; };
  internalNotes?: Array<{
    author: string;
    content: string;
    time: string;
    isSystem: boolean;
  }>;
}

export interface SubmissionListItem {
  id: string;
  type: TouchpointType;
  location: string;
  status: SubmissionStatus;
  department: string;
  priority: Priority;
  submittedAt: string;
}

// --- Module: Reports & Issues ---

export interface InternalReport {
  id: string; // Report/Issue code
  uuid: string;
  title: string;
  content: string;
  description?: string;
  status: InternalReportStatus;
  priority: Priority;
  reportType: ReportType;
  locationId: string;
  locationName?: string;
  departmentId: string;
  departmentName?: string;
  templateId?: string;
  templateName?: string;
  reportedBy?: string;
  date?: string;
  fieldValues?: Record<string, any>;
  location: string | { id: string; name: string; airportCode: string; city: string; };
  department: string | null | { id: string; name: string; code: string; };
  author: string | { id: string; firstName: string; lastName: string; email: string; };
  assignee: string | null | { id: string; firstName: string; lastName: string; email: string; };
  createdAt: string;
  internalNotes?: Array<{
    author: string;
    content: string;
    time: string;
    isSystem: boolean;
  }>;
  notes?: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
    isSystem: boolean;
  }>;
}

export interface ReportTemplate {
  id: string;
  uuid: string;
  name: string;
  description: string | null;
  locationId: string;
  locationName?: string;
  departmentId: string;
  departmentName?: string;
  fields: ReportTemplateField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplateField {
  id: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

// --- Module: Analytics ---

export interface AnalyticsSummary {
  totalSubmissions: number;
  openSubmissions: number;
  resolvedSubmissions: number;
  archivedSubmissions: number;
  incidents: number;
  complaints: number;
  feedbacks: number;
  totalIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  averageRating: number | null;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsTrends {
  submissions: TrendPoint[];
  issues: TrendPoint[];
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsDistribution {
  byType: DistributionItem[];
  byStatus: DistributionItem[];
  byPriority: DistributionItem[];
}

export interface LocationPerformance {
  id: string;
  name: string;
  code: string;
  submissions: number;
  openSubmissions: number;
  resolvedSubmissions: number;
  issues: number;
  averageRating: number | null;
}

export interface DeptPerformance {
  id: string;
  name: string;
  code: string;
  submissions: number;
  openSubmissions: number;
  resolvedSubmissions: number;
  issues: number;
  averageRating: number | null;
}

export interface TouchpointTop {
  id: string;
  title: string;
  location: string;
  department: string;
  submissions: number;
  interactions: number;
  averageRating: number | null;
}
