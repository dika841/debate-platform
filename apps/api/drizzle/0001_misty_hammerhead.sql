CREATE TABLE "debate_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"title" varchar(120) NOT NULL,
	"motion" varchar(300) NOT NULL,
	"description" varchar(2000),
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"team_size" integer DEFAULT 3 NOT NULL,
	"round_count" integer DEFAULT 3 NOT NULL,
	"submission_duration_minutes" integer DEFAULT 30 NOT NULL,
	"voting_duration_minutes" integer DEFAULT 30 NOT NULL,
	"spectator_voting_enabled" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debate_rooms" ADD CONSTRAINT "debate_rooms_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_debate_rooms_host" ON "debate_rooms" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_debate_rooms_status_created" ON "debate_rooms" USING btree ("status","created_at");