import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationServiceService } from './recommendation-service.service';

describe('RecommendationServiceService', () => {
  let service: RecommendationServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecommendationServiceService],
    }).compile();

    service = module.get<RecommendationServiceService>(RecommendationServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
