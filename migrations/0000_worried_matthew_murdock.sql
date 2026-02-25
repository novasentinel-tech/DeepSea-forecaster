CREATE TABLE "data_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_id" integer NOT NULL,
	"value" numeric NOT NULL,
	"date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"format" varchar(50) DEFAULT 'number' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_points" ADD CONSTRAINT "data_points_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE cascade ON UPDATE no action;