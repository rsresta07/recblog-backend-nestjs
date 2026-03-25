import { Test, TestingModule } from '@nestjs/testing';
import { MagicFixController } from './magic-fix.controller';
import { MagicFixService } from './magic-fix.service';

describe('MagicFixController', () => {
  let controller: MagicFixController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MagicFixController],
      providers: [MagicFixService],
    }).compile();

    controller = module.get<MagicFixController>(MagicFixController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
