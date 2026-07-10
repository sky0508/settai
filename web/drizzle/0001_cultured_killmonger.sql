CREATE TABLE "schedule_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"guest_id" uuid,
	"edit_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_participants_poll_email_unique" UNIQUE("poll_id","email")
);
--> statement-breakpoint
CREATE TABLE "schedule_polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"title" text NOT NULL,
	"note" text,
	"timezone" text DEFAULT 'Asia/Tokyo' NOT NULL,
	"public_token" text NOT NULL,
	"admin_token" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"confirmed_slot_id" uuid,
	"reservation_id" uuid,
	"headcount_hint" integer,
	"purpose" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_polls_public_token_unique" UNIQUE("public_token"),
	CONSTRAINT "schedule_polls_admin_token_unique" UNIQUE("admin_token")
);
--> statement-breakpoint
CREATE TABLE "schedule_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"available" text DEFAULT 'yes' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_responses_participant_slot_unique" UNIQUE("participant_id","slot_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"starts_at" timestamp NOT NULL,
	"slot_minutes" integer DEFAULT 30 NOT NULL,
	"sort_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "photos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_poll_id_schedule_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."schedule_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_participants" ADD CONSTRAINT "schedule_participants_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_polls" ADD CONSTRAINT "schedule_polls_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_polls" ADD CONSTRAINT "schedule_polls_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_responses" ADD CONSTRAINT "schedule_responses_participant_id_schedule_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."schedule_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_responses" ADD CONSTRAINT "schedule_responses_slot_id_schedule_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."schedule_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_poll_id_schedule_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."schedule_polls"("id") ON DELETE cascade ON UPDATE no action;