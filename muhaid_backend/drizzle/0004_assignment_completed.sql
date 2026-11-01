ALTER TABLE "template_assignments" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "template_assignments" ta SET "completed_at" = i.first_received FROM (SELECT "template_id", "inspector_id", min("received_at") AS first_received FROM "inspections" GROUP BY 1, 2) i WHERE ta."template_id" = i."template_id" AND ta."user_id" = i."inspector_id";
