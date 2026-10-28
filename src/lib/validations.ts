import { z } from 'zod'

// ─── Company ──────────────────────────────────────────────

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  careersUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  industry: z.string().max(200).optional().or(z.literal('')),
  technologies: z.array(z.string()).default([]),
  hiringNotes: z.string().max(2000).optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  lastResearchedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

export type CompanyFormData = z.infer<typeof companySchema>

// ─── Contact ──────────────────────────────────────────────

export const contactSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  role: z.string().max(200).optional().or(z.literal('')),
  companyId: z.string().uuid().optional().nullable(),
  profileUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  publicSourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category: z.enum([
    'RECRUITER', 'HR', 'SENIOR_FRONTEND_DEV', 'TECH_LEAD',
    'ENGINEERING_MANAGER', 'OTHER',
  ]).default('OTHER'),
  location: z.string().max(200).optional().or(z.literal('')),
  reasonForTargeting: z.string().max(2000).optional().or(z.literal('')),
  personalizationNotes: z.string().max(5000).optional().or(z.literal('')),
  relationshipStatus: z.enum([
    'TO_RESEARCH', 'READY_FOR_OUTREACH', 'REQUEST_SENT', 'CONNECTED',
    'MESSAGE_SENT', 'REPLIED', 'REFERRAL_DISCUSSED', 'FOLLOW_UP_NEEDED', 'ARCHIVED',
  ]).default('TO_RESEARCH'),
  lastContactDate: z.coerce.date().optional().nullable(),
  nextFollowUpDate: z.coerce.date().optional().nullable(),
  networkingPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  verificationStatus: z.enum(['VERIFIED', 'OUTDATED', 'UNCERTAIN']).default('UNCERTAIN'),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

export type ContactFormData = z.infer<typeof contactSchema>

// ─── Opportunity ──────────────────────────────────────────

export const opportunitySchema = z.object({
  title: z.string().min(1, 'Job title is required').max(300),
  companyId: z.string().uuid().optional().nullable(),
  description: z.string().max(10000).optional().or(z.literal('')),
  requiredTechnologies: z.array(z.string()).default([]),
  experienceLevel: z.enum([
    'INTERNSHIP', 'FRESHER', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'UNKNOWN',
  ]).default('UNKNOWN'),
  location: z.string().max(200).optional().or(z.literal('')),
  workArrangement: z.enum(['ON_SITE', 'HYBRID', 'REMOTE', 'UNKNOWN']).default('UNKNOWN'),
  salaryMin: z.coerce.number().int().positive().optional().nullable(),
  salaryMax: z.coerce.number().int().positive().optional().nullable(),
  salaryCurrency: z.string().max(10).optional().or(z.literal('')),
  jobUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  applicationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sourceName: z.string().max(200).optional().or(z.literal('')),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  dateDiscovered: z.coerce.date().default(() => new Date()),
  deadline: z.coerce.date().optional().nullable(),
  dateApplied: z.coerce.date().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum([
    'SAVED', 'TO_REVIEW', 'READY_TO_APPLY', 'APPLIED',
    'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'CLOSED',
  ]).default('SAVED'),
  verificationFlag: z.enum(['VERIFIED', 'OUTDATED', 'UNCERTAIN']).default('UNCERTAIN'),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

export type OpportunityFormData = z.infer<typeof opportunitySchema>

// ─── Login ────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>
