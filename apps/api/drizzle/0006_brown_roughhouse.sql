CREATE TABLE "content_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"submission_id" text,
	"reporter_id" text NOT NULL,
	"category" text NOT NULL,
	"details" varchar(2000) NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"resolution_note" varchar(1000),
	"resolved_by_id" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_results" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"outcome" text NOT NULL,
	"pro_wins" integer NOT NULL,
	"contra_wins" integer NOT NULL,
	"draws" integer NOT NULL,
	"finalized_by_id" text NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round_results" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"room_id" text NOT NULL,
	"outcome" text NOT NULL,
	"pro_count" integer NOT NULL,
	"contra_count" integer NOT NULL,
	"total_votes" integer NOT NULL,
	"finalized_by_id" text NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_submission_id_round_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."round_submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_results" ADD CONSTRAINT "room_results_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_results" ADD CONSTRAINT "room_results_finalized_by_id_users_id_fk" FOREIGN KEY ("finalized_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_results" ADD CONSTRAINT "round_results_round_id_debate_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."debate_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_results" ADD CONSTRAINT "round_results_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_results" ADD CONSTRAINT "round_results_finalized_by_id_users_id_fk" FOREIGN KEY ("finalized_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_reports_status_created" ON "content_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_content_reports_room" ON "content_reports" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_room_results_room" ON "room_results" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_round_results_round" ON "round_results" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_round_results_room" ON "round_results" USING btree ("room_id");