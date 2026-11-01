CREATE TYPE "public"."answer_value" AS ENUM('yes', 'no', 'na');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'inspector');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'inspector' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "inspection_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_dates_chk" CHECK ("inspection_templates"."valid_to" IS NULL OR "inspection_templates"."valid_to" >= "inspection_templates"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "template_items_position_uq" UNIQUE("template_id","position"),
	CONSTRAINT "template_items_tpl_id_uq" UNIQUE("template_id","id"),
	CONSTRAINT "template_items_position_chk" CHECK ("template_items"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid NOT NULL,
	"work_order_number" text NOT NULL,
	"inspector_id" uuid,
	"photo_path" text NOT NULL,
	"filled_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspections_id_tpl_uq" UNIQUE("id","template_id"),
	CONSTRAINT "inspections_work_order_chk" CHECK (btrim("inspections"."work_order_number") <> '')
);
--> statement-breakpoint
CREATE TABLE "inspection_answers" (
	"inspection_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_label" text NOT NULL,
	"answer" "answer_value" NOT NULL,
	"note" text,
	CONSTRAINT "inspection_answers_inspection_id_item_id_pk" PRIMARY KEY("inspection_id","item_id"),
	CONSTRAINT "note_required_when_no_chk" CHECK ("inspection_answers"."answer" <> 'no' OR ("inspection_answers"."note" IS NOT NULL AND btrim("inspection_answers"."note") <> ''))
);
--> statement-breakpoint
ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_template_id_inspection_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_template_id_inspection_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_answers" ADD CONSTRAINT "inspection_answers_inspection_fk" FOREIGN KEY ("inspection_id","template_id") REFERENCES "public"."inspections"("id","template_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_answers" ADD CONSTRAINT "inspection_answers_item_fk" FOREIGN KEY ("template_id","item_id") REFERENCES "public"."template_items"("template_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "inspection_templates_project_idx" ON "inspection_templates" USING btree ("project_id","valid_from" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inspections_work_order_idx" ON "inspections" USING btree ("work_order_number","filled_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inspections_template_idx" ON "inspections" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "inspections_inspector_idx" ON "inspections" USING btree ("inspector_id");--> statement-breakpoint
CREATE INDEX "inspections_received_at_idx" ON "inspections" USING btree ("received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inspection_answers_item_idx" ON "inspection_answers" USING btree ("template_id","item_id");