import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { SeedsService } from "./seeds.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedsService = app.get(SeedsService);

  await seedsService.seedAdminData();
  await app.close();
}
bootstrap();
