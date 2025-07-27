import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { SeedsService } from "./seeds.service";

/**
 * Initializes the Nest application context and seeds the admin data.
 * It creates the application context using the AppModule, retrieves the
 * SeedsService, calls the seedAdminData method to seed admin data, and
 * finally closes the application context.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedsService = app.get(SeedsService);

  await seedsService.seedAdminData();
  await app.close();
}
bootstrap();
