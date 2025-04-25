import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SeedsService } from './database/seeds/seeds.service';
import { User } from './user/entities/user.entity';
import { UserService } from './user/user.service';
import { BcryptService } from './auth/bcryptjs/bcrypt.service';
import { Pagination } from 'nestjs-typeorm-paginate';
import MailConfig from './config/mail.config';
import { HealthCheckModule } from './health-check/health-check.module';
import { PostModule } from './post/post.module';
import { AboutUsModule } from './about-us/about-us.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    // MailerModule.forRoot(MailConfig),

    TypeOrmModule.forFeature([User]),
    AuthModule,
    UserModule,
    HealthCheckModule,
    PostModule,
    AboutUsModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedsService, UserService, BcryptService, Pagination],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedsService: SeedsService) {}

  async onModuleInit() {}
}
