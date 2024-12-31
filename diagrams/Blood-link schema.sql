CREATE TABLE "user" (
  "id" uuid PRIMARY KEY,
  "first_name" varchar,
  "last_name" varchar,
  "email" varchar UNIQUE NOT NULL,
  "phone" varchar UNIQUE NOT NULL,
  "password" varchar,
  "bloodType" enum(A+,A-,B+,B-,AB+,AB-,O+,O-),
  "role" enum(user,admin) DEFAULT 'user',
  "user_source" enum(self,google) DEFAULT 'self',
  "status" enum(active, inactive) DEFAULT 'self',
  "primary_location" varchar,
  "last_known_location" varchar,
  "last_donation_date" date,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "donation_request" (
  "id" uuid PRIMARY KEY,
  "requester_id" uuid,
  "bloodType" enum(A+,A-,B+,B-,AB+,AB-,O+,O-),
  "urgency" enum(low,medium,high) DEFAULT 'high',
  "status" enum(open,fulfilled,closed) DEFAULT 'open',
  "request_location" varchar,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "donation" (
  "id" uuid PRIMARY KEY,
  "donor_id" uuid,
  "request_id" uuid,
  "status" enum(scheduled,completed,cancelled) DEFAULT 'scheduled',
  "donation_date" date,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "notification" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "content" varchar,
  "status" enum(sent,delivered,read,failed),
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "health_facility" (
  "id" uuid PRIMARY KEY,
  "name" varchar,
  "location" varchar,
  "phone" varchar UNIQUE NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "token" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "type" enum(refresh,verification,password_reset) DEFAULT 'refresh',
  "created_at" timestamp,
  "updated_at" timestamp
);

ALTER TABLE "donation_request" ADD FOREIGN KEY ("requester_id") REFERENCES "user" ("id");

ALTER TABLE "donation" ADD FOREIGN KEY ("donor_id") REFERENCES "user" ("id");

ALTER TABLE "donation" ADD FOREIGN KEY ("request_id") REFERENCES "donation_request" ("id");

ALTER TABLE "notification" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "token" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");
