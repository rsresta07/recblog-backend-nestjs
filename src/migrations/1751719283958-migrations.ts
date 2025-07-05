import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1751719283958 implements MigrationInterface {
    name = 'Migrations1751719283958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_tag" DROP CONSTRAINT "FK_d2fd5340bb68556fe93650fedc1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5ec92f15aaa1e371f2662f681"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2fd5340bb68556fe93650fedc"`);
        await queryRunner.query(`CREATE INDEX "IDX_b5ec92f15aaa1e371f2662f681" ON "post_tag" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d2fd5340bb68556fe93650fedc" ON "post_tag" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "post_tag" ADD CONSTRAINT "FK_d2fd5340bb68556fe93650fedc1" FOREIGN KEY ("tag_id") REFERENCES "tags"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_tag" DROP CONSTRAINT "FK_d2fd5340bb68556fe93650fedc1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2fd5340bb68556fe93650fedc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5ec92f15aaa1e371f2662f681"`);
        await queryRunner.query(`CREATE INDEX "IDX_d2fd5340bb68556fe93650fedc" ON "post_tag" ("tag_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b5ec92f15aaa1e371f2662f681" ON "post_tag" ("post_id") `);
        await queryRunner.query(`ALTER TABLE "post_tag" ADD CONSTRAINT "FK_d2fd5340bb68556fe93650fedc1" FOREIGN KEY ("tag_id") REFERENCES "tags"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
