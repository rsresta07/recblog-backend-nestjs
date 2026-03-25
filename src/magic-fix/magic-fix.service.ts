import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateMagicFixDto } from "./dto/create-magic-fix.dto";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

@Injectable()
export class MagicFixService {
  async magicFix(magicFixDto: CreateMagicFixDto) {
    const { text, instruction } = magicFixDto;

    // 1. Check if the API key exists in your environment variables
    if (!process.env.GOOGLE_API_KEY) {
      throw new HttpException(
        "Google API Key is not configured on the server.",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    try {
      // 2. Initialize the Gemini Model (Flash is perfect for fast editing)
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.5, // Low temperature means less hallucination, more editing
        maxRetries: 2,
      });

      // 3. Define the exact JSON shape we want back
      const outputSchema = z.object({
        editedText: z
          .string()
          .describe("The improved HTML text. You MUST preserve all HTML tags."),
        explanation: z
          .string()
          .describe("A short 1-sentence summary of what was changed."),
      });

      // 4. Bind the schema to the model
      const structuredLlm = llm.withStructuredOutput(outputSchema);

      // 5. Create the prompt
      const prompt = `
        You are an expert copyeditor for a multi-user blogging platform.
        Your job is to improve the following text. 
        
        Instruction: ${
          instruction || "Fix grammar, spelling, and improve flow."
        }
        
        CRITICAL RULES: 
        1. The input contains HTML tags. You MUST preserve the exact HTML structure.
        2. Only edit the text content inside the tags.
        3. Do not add markdown blocks like \`\`\`html to your response.

        Original Text:
        ${text}
      `;

      // 6. Invoke the AI
      const result = await structuredLlm.invoke(prompt);

      return result; // Returns { editedText: "...", explanation: "..." }
    } catch (error) {
      console.error("Gemini AI Error:", error);
      throw new HttpException(
        `AI Edit failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
