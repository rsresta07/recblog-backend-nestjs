import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  test(): string {
    return 'API working perfectly fine!';
  }
}
