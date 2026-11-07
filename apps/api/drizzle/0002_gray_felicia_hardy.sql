CREATE TABLE "room_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"team" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_memberships" ADD CONSTRAINT "room_memberships_room_id_debate_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."debate_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_memberships" ADD CONSTRAINT "room_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_room_memberships_room_user" ON "room_memberships" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_room_memberships_room_role" ON "room_memberships" USING btree ("room_id","role");--> statement-breakpoint
CREATE INDEX "idx_room_memberships_user" ON "room_memberships" USING btree ("user_id");