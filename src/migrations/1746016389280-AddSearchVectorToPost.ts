import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchVectorToPost1746016389280 implements MigrationInterface {
  name = "AddSearchVectorToPost1746016389280";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the 'search_vector' column
    await queryRunner.query(
      `ALTER TABLE "post" ADD COLUMN "search_vector" tsvector;`
    );

    // Create the function to update search_vector
    await queryRunner.query(`
      CREATE FUNCTION update_post_search_vector() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.content);
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);

    // Create the trigger to update search_vector on insert or update
    await queryRunner.query(`
      CREATE TRIGGER post_search_vector_trigger
      BEFORE INSERT OR UPDATE ON "post"
      FOR EACH ROW
      EXECUTE FUNCTION update_post_search_vector();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the trigger and function in case of rollback
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS post_search_vector_trigger ON "post";`
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_post_search_vector;`
    );

    // Drop the 'search_vector' column in case of rollback
    await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "search_vector";`);
  }
}
