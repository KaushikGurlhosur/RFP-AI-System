/**
 * AI Service for RFP Management System
 * Uses Hugging Face Inference API with Mistral-7B model
 */

import { HfInference } from "@huggingface/inference";

/**
 * ============================================
 * PART 1: Define What Data We Expect from AI
 * ============================================
 *
 * We create TypeScript interfaces to define the shape of data.
 * This helps with type safety and makes our code clearer.
 */

/**
 * A single item in the RFP (like laptops, monitors)
 */
export interface RFPItem {
  name: string; // "Laptops"
  quantity: number; // 20
  specifications: Record<string, string>; // {"ram": "16GB", "storage": "512GB"}
}

/**
 * Standard terms for procurement
 */
export interface RFPTerms {
  payment: string; // "Net 30"
  warranty: string; // "1 year"
  delivery: string; // "Within 30 days"
}

/**
 * When AI parses an RFP description, we expect this structure
 */
export interface ParsedRFP {
  title: string; // Example: "Office Laptop Procurement"
  summary: string; // Brief summary of requirements
  budget?: number; // 50000 (if mentioned)
  deadline?: string; // "within 30 days"
  items: RFPItem[]; // List of items needed
  terms: RFPTerms; // Payment, warranty, delivery terms
}

/**
 * ============================================
 * PART 2: Create the AI Service Class
 * ============================================
 *
 * This class will handle all AI interactions.
 */
export class AIService {
  private hf: HfInference; // Hugging Face client
  private model: string; // Which model to use

  /**
   * Constructor - Sets up the AI service
   *
   * Explanation:
   * 1. Gets API key from environment variables (.env.local)
   * 2. Creates Hugging Face client with the key
   * 3. Sets which model to use (from .env.local or default)
   */
  constructor() {
    // Get API key from .env.local
    const apiKey = process.env.HF_API_KEY;

    // Check if API key exists
    if (!apiKey) {
      throw new Error(
        "❌ HF_API_KEY is missing in .env.local\n" +
          'Add: HF_API_KEY="your_hugging_face_token_here"'
      );
    }

    // Create Hugging Face client
    this.hf = new HfInference(apiKey);

    // Use model from .env.local or default to Mistral-7B
    this.model = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";

    console.log(`✅ AI Service initialized with model: ${this.model}`);
  }

  /**
   * ============================================
   * PART 3: Helper Method to Call AI
   * ============================================
   *
   * This method handles calling Hugging Face API.
   * It's reusable for all our AI tasks.
   */
  private async callAI(
    prompt: string,
    maxTokens: number = 1000
  ): Promise<string> {
    console.log(`🤖 Sending request to ${this.model}...`);

    try {
      // Call Hugging Face API
      const response = await this.hf.textGeneration({
        model: this.model, // Which model to use
        inputs: prompt, // Our question/instruction
        parameters: {
          max_new_tokens: maxTokens, // Maximum response length
          temperature: 0.1, // Low = consistent responses
          return_full_text: false, // Don't include our prompt in response
        },
      });

      // Get the AI's response
      const result = response.generated_text;

      if (!result) {
        throw new Error("AI returned empty response");
      }

      console.log(`📝 AI Response length: ${result.length} characters`);
      return result.trim();
    } catch (error) {
      console.error("❌ AI API error:", error.message);

      // Helpful error messages
      if (error.message.includes("401")) {
        throw new Error(
          "Invalid Hugging Face API key. Check HF_API_KEY in .env.local"
        );
      }
      if (error.message.includes("429")) {
        throw new Error(
          "Rate limit exceeded. Free tier has limits. Wait a minute."
        );
      }

      throw error;
    }
  }

  /**
   * ============================================
   * PART 4: Health Check Method
   * ============================================
   *
   * Tests if AI service is working.
   * This is useful for debugging.
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    message: string;
    model: string;
  }> {
    console.log("🩺 Checking AI service health...");

    try {
      // Simple test - ask AI to say "OK"
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: "Say 'OK' if you're working.",
        parameters: {
          max_new_tokens: 10,
          temperature: 0.1,
        },
      });

      const isHealthy = response.generated_text?.includes("OK") || false;

      return {
        healthy: isHealthy,
        message: isHealthy ? "AI service is working" : "Unexpected response",
        model: this.model,
      };
    } catch (error) {
      console.error("❌ Health check failed:", error.message);
      return {
        healthy: false,
        message: `AI service error: ${error.message}`,
        model: this.model,
      };
    }
  }
}

/**
 * ============================================
 * PART 5: Create a Singleton Instance
 * ============================================
 *
 * We export one instance of AIService.
 * This ensures we only create one connection to Hugging Face.
 */
export const aiService = new AIService();
