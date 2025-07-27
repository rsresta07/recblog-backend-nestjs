import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Test")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  /**
   * Simple API to test the NestJS framework.
   *
   * @returns "Hello World!"
   */
  testAPI(): string {
    return this.appService.test();
  }
}
