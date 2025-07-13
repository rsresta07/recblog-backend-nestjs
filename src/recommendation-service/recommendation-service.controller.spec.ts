import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationServiceController } from './recommendation-service.controller';
import { RecommendationServiceService } from './recommendation-service.service';

describe('RecommendationServiceController', () => {
  let controller: RecommendationServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationServiceController],
      providers: [RecommendationServiceService],
    }).compile();

    controller = module.get<RecommendationServiceController>(RecommendationServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
