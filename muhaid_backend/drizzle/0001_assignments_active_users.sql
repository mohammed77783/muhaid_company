CREATE TABLE "template_assignments" (
	"template_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_assignments_template_id_user_id_pk" PRIMARY KEY("template_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "inspections" DROP CONSTRAINT "inspections_inspector_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "inspections" ALTER COLUMN "inspector_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "template_assignments" ADD CONSTRAINT "template_assignments_template_id_inspection_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_assignments" ADD CONSTRAINT "template_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_assignments" ADD CONSTRAINT "template_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_assignments_user_idx" ON "template_assignments" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;