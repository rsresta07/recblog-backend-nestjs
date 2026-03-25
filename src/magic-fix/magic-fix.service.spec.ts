import { Test, TestingModule } from '@nestjs/testing';
import { MagicFixService } from './magic-fix.service';

describe('MagicFixService', () => {
  let service: MagicFixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MagicFixService],
    }).compile();

    service = module.get<MagicFixService>(MagicFixService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
