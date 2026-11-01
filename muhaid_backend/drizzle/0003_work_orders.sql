CREATE SEQUENCE "work_order_seq";--> statement-breakpoint
ALTER TABLE "template_assignments" ADD COLUMN "work_order_number" text DEFAULT 'WO-' || lpad(nextval('work_order_seq')::text, 6, '0') NOT NULL;--> statement-breakpoint
ALTER TABLE "template_assignments" ADD CONSTRAINT "template_assignments_work_order_number_unique" UNIQUE("work_order_number");