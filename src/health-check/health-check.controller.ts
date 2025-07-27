import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("API Health Check")
@Controller()
export class HealthCheckController {
  @Get("/")
  /**
   * Get the root of the API. This is used to check if the API is up and running.
   * @returns {string} A string indicating that the API is working correctly.
   */
  getRoot(): string {
    return "Api working fine....";
  }

  @Get("/hc")
  /**
   * Health check endpoint.
   * @summary Health check endpoint
   * @description This endpoint can be used to check if the API is up and running.
   * @returns {string} A string indicating that the API is working correctly.
   */
  healthCheck(): string {
    return "Api working fine....";
  }

  @Get("/api/collins")
  /**
   * API Health Check
   * @summary API Health Check
   * @description This endpoint is used to check if the API is up and running.
   * @returns {string} A string indicating that the API is working correctly.
   */
  apiHealthCheck(): string {
    return "Api working fine....";
  }

  @Get("/api/v1")
  /**
   * API Version Health Check
   * @summary Checks the health of the API version.
   * @description This endpoint is used to verify if the specific version of the API is operational.
   * @returns {string} A string indicating that the API version is working correctly.
   */
  apiVersionHealthCheck(): string {
    return "Api working fine....";
  }
}
