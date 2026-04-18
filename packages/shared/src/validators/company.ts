import { z } from "zod";
import { COMPANY_STATUSES } from "../constants.js";

const feedbackDataSharingTermsVersionSchema = z.string().min(1).nullable().optional();

export const createCompanySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  budgetMonthlyCents: z.number().int().nonnegative().optional().default(0),
});

export type CreateCompany = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema
  .partial()
  .extend({
    status: z.enum(COMPANY_STATUSES).optional(),
    spentMonthlyCents: z.number().int().nonnegative().optional(),
    // Softclip pivot §6: requireBoardApprovalForNewAgents,
    // brandColor, logoAssetId removed.
    feedbackDataSharingEnabled: z.boolean().optional(),
    feedbackDataSharingConsentAt: z.coerce.date().nullable().optional(),
    feedbackDataSharingConsentByUserId: z.string().min(1).nullable().optional(),
    feedbackDataSharingTermsVersion: feedbackDataSharingTermsVersionSchema,
  });

export type UpdateCompany = z.infer<typeof updateCompanySchema>;

// Softclip pivot §6: updateCompanyBrandingSchema + UpdateCompanyBranding
// type removed along with the PATCH /companies/:id/branding endpoint.
// A residual type export is kept so external consumers that imported
// it see a recognisable error rather than a module-resolution failure.
export type UpdateCompanyBranding = never;
