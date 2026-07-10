CREATE TABLE "station_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_station" text NOT NULL,
	"to_station" text NOT NULL,
	"minutes" integer NOT NULL,
	"transfers" integer,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "nearest_station" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "lat" numeric;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "lng" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "office_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "office_nearest_station" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "office_lat" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "office_lng" numeric;--> statement-breakpoint
CREATE UNIQUE INDEX "station_routes_from_to_idx" ON "station_routes" USING btree ("from_station","to_station");