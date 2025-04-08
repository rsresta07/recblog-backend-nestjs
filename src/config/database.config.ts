import "dotenv/config";
import { DataSource } from "typeorm";

export const AppDataSource: any = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ["dist/**/*.entity.js"],
  logging: true,
  synchronize: true,
  //migrations credentials
  migrationsRun: true,

  migrations:
    ["dist/migrations/*.js"].length > 0
      ? ["dist/migrations/*.js"]
      : ["dist/src/migrations/*.js"],
  migrationsTableName: "migrations_history",
  // seeds: ['src/**/seeding/**/*.seeder.ts'],
  // factories: ['src/**/factories/**/*.ts'],
});
