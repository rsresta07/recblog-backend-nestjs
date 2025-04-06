import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("API Health Check")
@Controller()
export class HealthCheckController {
  @Get("/")
  getRoot(): string {
    return "Api working fine....";
  }

  @Get("/hc")
  healthCheck(): string {
    return "Api working fine....";
  }

  @Get("/api/collins")
  apiHealthCheck(): string {
    return "Api working fine....";
  }

  @Get("/api/v1")
  apiVersionHealthCheck(): string {
    return "Api working fine....";
  }
}
