-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('INTERNSHIP', 'FRESHER', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('SAVED', 'TO_REVIEW', 'READY_TO_APPLY', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VerificationFlag" AS ENUM ('VERIFIED', 'OUTDATED', 'UNCERTAIN');

-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('RECRUITER', 'HR', 'SENIOR_FRONTEND_DEV', 'TECH_LEAD', 'ENGINEERING_MANAGER', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('TO_RESEARCH', 'READY_FOR_OUTREACH', 'REQUEST_SENT', 'CONNECTED', 'MESSAGE_SENT', 'REPLIED', 'REFERRAL_DISCUSSED', 'FOLLOW_UP_NEEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageGoal" AS ENUM ('INITIAL_CONNECTION', 'POST_ACCEPTANCE', 'ASK_ABOUT_JOB', 'ASK_ADVICE', 'ASK_REFERRAL', 'THANK_YOU', 'FOLLOW_UP_NO_RESPONSE');

-- CreateEnum
CREATE TYPE "MessageLanguage" AS ENUM ('EGYPTIAN_ARABIC', 'ENGLISH', 'MSA');

-- CreateEnum
CREATE TYPE "MessageTone" AS ENUM ('CONCISE_DIRECT', 'FRIENDLY_PROFESSIONAL', 'FORMAL');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'REPLIED', 'NO_REPLY');

-- CreateEnum
CREATE TYPE "FollowUpState" AS ENUM ('OPEN', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferredRole" TEXT NOT NULL DEFAULT 'React.js / Next.js Frontend Developer',
    "targetCountry" TEXT NOT NULL DEFAULT 'Egypt',
    "preferredExperience" TEXT[] DEFAULT ARRAY['INTERNSHIP', 'FRESHER', 'JUNIOR']::TEXT[],
    "workPreference" "WorkArrangement" NOT NULL DEFAULT 'REMOTE',
    "preferredLanguage" "MessageLanguage" NOT NULL DEFAULT 'ENGLISH',
    "dailyNetworkingTarget" INTEGER NOT NULL DEFAULT 5,
    "followUpDefaultDays" INTEGER NOT NULL DEFAULT 3,
    "cvFileReference" TEXT,
    "cvUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "careersUrl" TEXT,
    "location" TEXT,
    "industry" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiringNotes" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "lastResearchedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT,
    "companyId" UUID,
    "profileUrl" TEXT,
    "publicSourceUrl" TEXT,
    "category" "ContactCategory" NOT NULL DEFAULT 'OTHER',
    "location" TEXT,
    "reasonForTargeting" TEXT,
    "personalizationNotes" TEXT,
    "relationshipStatus" "RelationshipStatus" NOT NULL DEFAULT 'TO_RESEARCH',
    "lastContactDate" TIMESTAMP(3),
    "nextFollowUpDate" TIMESTAMP(3),
    "networkingPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "verificationStatus" "VerificationFlag" NOT NULL DEFAULT 'UNCERTAIN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "companyId" UUID,
    "description" TEXT,
    "requiredTechnologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'UNKNOWN',
    "location" TEXT,
    "workArrangement" "WorkArrangement" NOT NULL DEFAULT 'UNKNOWN',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT,
    "jobUrl" TEXT,
    "applicationUrl" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "dateDiscovered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "dateApplied" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'SAVED',
    "verificationFlag" "VerificationFlag" NOT NULL DEFAULT 'UNCERTAIN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts_on_opportunities" (
    "contactId" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_on_opportunities_pkey" PRIMARY KEY ("contactId","opportunityId")
);

-- CreateTable
CREATE TABLE "message_drafts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contactId" UUID,
    "opportunityId" UUID,
    "goal" "MessageGoal" NOT NULL,
    "language" "MessageLanguage" NOT NULL DEFAULT 'ENGLISH',
    "tone" "MessageTone" NOT NULL DEFAULT 'FRIENDLY_PROFESSIONAL',
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "sourceFacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_revisions" (
    "id" UUID NOT NULL,
    "draftId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_activities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contactId" UUID,
    "companyId" UUID,
    "opportunityId" UUID,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "outcome" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_tasks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contactId" UUID,
    "companyId" UUID,
    "opportunityId" UUID,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "state" "FollowUpState" NOT NULL DEFAULT 'OPEN',
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_up_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_entries" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_on_companies" (
    "tagId" UUID NOT NULL,
    "companyId" UUID NOT NULL,

    CONSTRAINT "tags_on_companies_pkey" PRIMARY KEY ("tagId","companyId")
);

-- CreateTable
CREATE TABLE "tags_on_contacts" (
    "tagId" UUID NOT NULL,
    "contactId" UUID NOT NULL,

    CONSTRAINT "tags_on_contacts_pkey" PRIMARY KEY ("tagId","contactId")
);

-- CreateTable
CREATE TABLE "tags_on_opportunities" (
    "tagId" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,

    CONSTRAINT "tags_on_opportunities_pkey" PRIMARY KEY ("tagId","opportunityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "settings_userId_key" ON "settings"("userId");

-- CreateIndex
CREATE INDEX "companies_userId_idx" ON "companies"("userId");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_priority_idx" ON "companies"("priority");

-- CreateIndex
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId");

-- CreateIndex
CREATE INDEX "contacts_fullName_idx" ON "contacts"("fullName");

-- CreateIndex
CREATE INDEX "contacts_relationshipStatus_idx" ON "contacts"("relationshipStatus");

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");

-- CreateIndex
CREATE INDEX "contacts_nextFollowUpDate_idx" ON "contacts"("nextFollowUpDate");

-- CreateIndex
CREATE INDEX "opportunities_userId_idx" ON "opportunities"("userId");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_priority_idx" ON "opportunities"("priority");

-- CreateIndex
CREATE INDEX "opportunities_companyId_idx" ON "opportunities"("companyId");

-- CreateIndex
CREATE INDEX "opportunities_dateDiscovered_idx" ON "opportunities"("dateDiscovered");

-- CreateIndex
CREATE INDEX "opportunities_deadline_idx" ON "opportunities"("deadline");

-- CreateIndex
CREATE INDEX "message_drafts_userId_idx" ON "message_drafts"("userId");

-- CreateIndex
CREATE INDEX "message_drafts_contactId_idx" ON "message_drafts"("contactId");

-- CreateIndex
CREATE INDEX "message_drafts_status_idx" ON "message_drafts"("status");

-- CreateIndex
CREATE INDEX "message_revisions_draftId_idx" ON "message_revisions"("draftId");

-- CreateIndex
CREATE INDEX "outreach_activities_userId_idx" ON "outreach_activities"("userId");

-- CreateIndex
CREATE INDEX "outreach_activities_activityDate_idx" ON "outreach_activities"("activityDate");

-- CreateIndex
CREATE INDEX "outreach_activities_contactId_idx" ON "outreach_activities"("contactId");

-- CreateIndex
CREATE INDEX "follow_up_tasks_userId_idx" ON "follow_up_tasks"("userId");

-- CreateIndex
CREATE INDEX "follow_up_tasks_dueDate_idx" ON "follow_up_tasks"("dueDate");

-- CreateIndex
CREATE INDEX "follow_up_tasks_state_idx" ON "follow_up_tasks"("state");

-- CreateIndex
CREATE INDEX "communication_entries_contactId_idx" ON "communication_entries"("contactId");

-- CreateIndex
CREATE INDEX "communication_entries_date_idx" ON "communication_entries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_on_opportunities" ADD CONSTRAINT "contacts_on_opportunities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_on_opportunities" ADD CONSTRAINT "contacts_on_opportunities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_revisions" ADD CONSTRAINT "message_revisions_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "message_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_activities" ADD CONSTRAINT "outreach_activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_entries" ADD CONSTRAINT "communication_entries_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_companies" ADD CONSTRAINT "tags_on_companies_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_companies" ADD CONSTRAINT "tags_on_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_contacts" ADD CONSTRAINT "tags_on_contacts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_contacts" ADD CONSTRAINT "tags_on_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_opportunities" ADD CONSTRAINT "tags_on_opportunities_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_opportunities" ADD CONSTRAINT "tags_on_opportunities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

