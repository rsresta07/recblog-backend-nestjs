import { Test, TestingModule } from '@nestjs/testing';
import { AboutUsController } from './about-us.controller';
import { AboutUsService } from './about-us.service';

describe('AboutUsController', () => {
  let controller: AboutUsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AboutUsController],
      providers: [AboutUsService],
    }).compile();

    controller = module.get<AboutUsController>(AboutUsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
