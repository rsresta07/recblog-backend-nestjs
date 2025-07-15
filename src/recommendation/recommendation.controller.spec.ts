import { Test, TestingModule } from "@nestjs/testing";
import { RecommendationServiceController } from "./recommendation.controller";
import { RecommendationService } from "./recommendation.service";

describe("RecommendationServiceController", () => {
  let controller: RecommendationServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationServiceController],
      providers: [RecommendationService],
    }).compile();

    controller = module.get<RecommendationServiceController>(
      RecommendationServiceController
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
