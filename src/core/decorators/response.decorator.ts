import { SetMetadata } from "@nestjs/common";

export const ResponseMessageKey = "ResponseMessageKey";
/**
 * Sets the response message for a given endpoint.
 *
 * The response message is used to create a more user-friendly response for the client.
 * The message is included in the response object, along with any other relevant data.
 *
 * @param {string} message - The message to be included in the response.
 * @returns {() => NestMiddleware} - The middleware function that sets the response message.
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(ResponseMessageKey, message);
