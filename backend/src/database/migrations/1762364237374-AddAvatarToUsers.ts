import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarToUsers1762364237374 implements MigrationInterface {
    name = 'AddAvatarToUsers1762364237374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "title" character varying(255) NOT NULL, "description" text, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'TODO', "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM', "dueDate" TIMESTAMP, "estimatedHours" double precision, "actualHours" double precision DEFAULT '0', "tags" text, "tenantId" uuid NOT NULL, "projectId" uuid NOT NULL, "assigneeId" uuid, "creatorId" uuid NOT NULL, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6086c8dafbae729a930c04d865" ON "tasks" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c300d154a85801889174e92a3d" ON "tasks" ("dueDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_fff681d315d607f9f03e0a434d" ON "tasks" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d41cf142c3c968c6a2d94abbb" ON "tasks" ("projectId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_ae65da000fc444b9746fdcbb13" ON "tasks" ("assigneeId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_aa62dc6e8e00c3c082c7fdf633" ON "tasks" ("tenantId", "status", "priority") `);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "name" character varying(100) NOT NULL, "description" text, "key" character varying(10) NOT NULL, "color" character varying(7) NOT NULL DEFAULT '#1890ff', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "tenantId" uuid NOT NULL, "ownerId" uuid NOT NULL, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_63e67599567b2126cfef14e147" ON "projects" ("key") `);
        await queryRunner.query(`CREATE INDEX "IDX_448b2462c0d35a96a820c926e0" ON "projects" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_53bfca237f11c0b69b16053708" ON "projects" ("tenantId", "isActive") `);
        await queryRunner.query(`CREATE TYPE "public"."tenants_subscriptionplan_enum" AS ENUM('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_subscriptionstatus_enum" AS ENUM('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "name" character varying(100) NOT NULL, "subdomain" character varying(50) NOT NULL, "settings" jsonb DEFAULT '{}', "subscriptionPlan" "public"."tenants_subscriptionplan_enum" NOT NULL DEFAULT 'FREE', "subscriptionStatus" "public"."tenants_subscriptionstatus_enum" NOT NULL DEFAULT 'TRIAL', "trialEndsAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_21bb89e012fa5b58532009c1601" UNIQUE ("subdomain"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_21bb89e012fa5b58532009c160" ON "tenants" ("subdomain") `);
        await queryRunner.query(`CREATE INDEX "IDX_e8e1ec7ec3bfd65359f0f4ff39" ON "tenants" ("isActive") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "email" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "firstName" character varying(50) NOT NULL, "lastName" character varying(50) NOT NULL, "avatar" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'MEMBER', "isActive" boolean NOT NULL DEFAULT true, "emailVerifiedAt" TIMESTAMP, "lastLoginAt" TIMESTAMP, "tenantId" uuid NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7346b08032078107fce81e014f" ON "users" ("email", "tenantId") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_fff681d315d607f9f03e0a434d1" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_90bc62e96b48a437a78593f78f0" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_448b2462c0d35a96a820c926e0f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_a8e7e6c3f9d9528ed35fe5bae33" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_a8e7e6c3f9d9528ed35fe5bae33"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_448b2462c0d35a96a820c926e0f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_90bc62e96b48a437a78593f78f0"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_fff681d315d607f9f03e0a434d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7346b08032078107fce81e014f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e8e1ec7ec3bfd65359f0f4ff39"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21bb89e012fa5b58532009c160"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_subscriptionstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_subscriptionplan_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53bfca237f11c0b69b16053708"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_448b2462c0d35a96a820c926e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63e67599567b2126cfef14e147"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa62dc6e8e00c3c082c7fdf633"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae65da000fc444b9746fdcbb13"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d41cf142c3c968c6a2d94abbb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fff681d315d607f9f03e0a434d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c300d154a85801889174e92a3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6086c8dafbae729a930c04d865"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    }

}
