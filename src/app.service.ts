import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  /**
   * Test API
   *
   * @returns string
   */
  test(): string {
    return "API working perfectly fine!";
  }
}
