import { Module } from '@nestjs/common';
import { MagicFixService } from './magic-fix.service';
import { MagicFixController } from './magic-fix.controller';

@Module({
  controllers: [MagicFixController],
  providers: [MagicFixService],
})
export class MagicFixModule {}
