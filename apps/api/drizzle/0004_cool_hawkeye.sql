CREATE TABLE "debate_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"opens_at" timestamp with time zone,
	"submission_deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"room_id" text NOT NULL,
	"author_id" text NOT NULL,
	"team" text NOT NULL,
	"content" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debate_rounds" ADD CONSTRAINT "debate_rounds_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_submissions" ADD CONSTRAINT "round_submissions_round_id_debate_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."debate_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_submissions" ADD CONSTRAINT "round_submissions_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_submissions" ADD CONSTRAINT "round_submissions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_debate_rounds_room_number" ON "debate_rounds" USING btree ("room_id","round_number");--> statement-breakpoint
CREATE INDEX "idx_debate_rounds_room_status" ON "debate_rounds" USING btree ("room_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_round_submissions_round_author" ON "round_submissions" USING btree ("round_id","author_id");--> statement-breakpoint
CREATE INDEX "idx_round_submissions_round" ON "round_submissions" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_round_submissions_room" ON "round_submissions" USING btree ("room_id");