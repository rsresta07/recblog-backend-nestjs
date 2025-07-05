import { DocumentBuilder } from "@nestjs/swagger";

const swaggerConfig = new DocumentBuilder()
  .setTitle("RecBlog API")
  .setDescription(
    "API for RecBlog project using node(nestjs) as backend language, typeorm as ORM and Postgres as Database."
  )
  .setVersion("1.0")
  .addBearerAuth()
  .build();

export default swaggerConfig;
