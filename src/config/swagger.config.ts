import { DocumentBuilder } from '@nestjs/swagger';

const swaggerConfig = new DocumentBuilder()
  .setTitle('SolveMCQ API')
  .setDescription(
    'API for SolveMCQ project using node(nestjs) as backend language, typeorm as ORM and Postgres as Database.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export default swaggerConfig;
