import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import * as compression from "compression";
import { SwaggerModule } from "@nestjs/swagger";
import swaggerConfig from "./config/swagger.config";
import { ResponseInterceptor } from "./core/interceptors/response.interceptor";
import { AppDataSource } from "./config/database.config";

/**
 * Starts the NestJS application.
 *
 * Applies global middleware and interceptors,
 * sets up the Swagger API documentation,
 * and starts the server on the given port.
 *
 * @returns {Promise<void>}
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: "http://localhost:3000", // Replace with your frontend's origin
    credentials: true,
  });
  app.use(compression());
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      //removes all properties of request's body which are not in dto
      whitelist: true,
      //all to transform properties, int -> string
      transform: false,
    })
  );
  app.enableShutdownHooks();
  app.useGlobalInterceptors(new ResponseInterceptor());

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.APP_PORT || 8080, () => {
    console.log("Server running on port:", process.env.APP_PORT || 8080);
    console.log(
      `Successfully connected to database: type:${AppDataSource?.options?.type},host:${AppDataSource?.options?.host},port:${AppDataSource?.options?.port},database:${AppDataSource?.options?.database}`
    );

    console.log(".....");
  });
}

bootstrap();
