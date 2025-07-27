import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { ResponseMessageKey } from "../decorators/response.decorator";
import { Response } from "../response/types";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  /**
   * This interceptor will wrap the response of the controller in a standard
   * response object, which contains a statusCode, message, and data.
   *
   * The statusCode is the HTTP status code of the response.
   * The message is the response message set by the @ResponseMessage() decorator.
   * The data is the response data returned by the controller.
   *
   * @param context The execution context of the current request.
   * @param next The call handler which will execute the controller and return an
   *     observable of the response data.
   * @returns An observable of the response data wrapped in a standard response
   *     object.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const responseMessage =
      new Reflector().get(ResponseMessageKey, context.getHandler()) ?? "";

    return next.handle().pipe(
      map((data) => {
        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: responseMessage,
          data,
        };
      })
    );
  }
}
