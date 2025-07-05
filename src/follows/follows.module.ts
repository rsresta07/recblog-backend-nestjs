import { Module } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { Follow } from 'src/user/entities/follow.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User])],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
