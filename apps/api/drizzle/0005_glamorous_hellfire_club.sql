CREATE TABLE "round_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"room_id" text NOT NULL,
	"voter_id" text NOT NULL,
	"team" text NOT NULL,
	"cast_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debate_rounds" ADD COLUMN "voting_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "round_votes" ADD CONSTRAINT "round_votes_round_id_debate_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."debate_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_votes" ADD CONSTRAINT "round_votes_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_votes" ADD CONSTRAINT "round_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_round_votes_round_voter" ON "round_votes" USING btree ("round_id","voter_id");--> statement-breakpoint
CREATE INDEX "idx_round_votes_round_team" ON "round_votes" USING btree ("round_id","team");