import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1762760642223 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tasks table indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_created 
      ON tasks(tenant_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_status_priority 
      ON tasks(tenant_id, status, priority) 
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_status 
      ON tasks(assignee_id, status) 
      WHERE assignee_id IS NOT NULL AND deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date 
      ON tasks(due_date) 
      WHERE due_date IS NOT NULL AND status NOT IN ('COMPLETED', 'CANCELLED');
    `);

    // Projects table indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_tenant_active 
      ON projects(tenant_id, is_active) 
      WHERE deleted_at IS NULL;
    `);

    // Users table indexes
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_active 
      ON users(tenant_id, is_active) 
      WHERE deleted_at IS NULL;
    `);

    // Audit logs table (MongoDB would have different approach)
    // Full-text search index on tasks
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_title_desc_search 
      ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tenant_created`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tenant_status_priority`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_assignee_status`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_due_date`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_projects_tenant_active`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_users_tenant_active`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_title_desc_search`);
  }

}
