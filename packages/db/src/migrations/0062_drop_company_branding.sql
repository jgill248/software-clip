-- Softclip pivot §6: drop company branding (logos + brand colors).
--
-- Dev teams don't brand their product with a logo in the control
-- plane; they ship software. The company_logos table, brand_color
-- column, and logo_asset_id column are all pure cosmetic surface
-- area being removed along with their UI (upload form, brand color
-- picker, logo rendering on the invite landing and sidebar).
--
-- The CEO-only PATCH /branding endpoint is gone along with this.

DROP TABLE IF EXISTS "company_logos";
--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN IF EXISTS "brand_color";
--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN IF EXISTS "logo_asset_id";
