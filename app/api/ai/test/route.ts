import { aiService } from "@/app/lib/ai-service";
import { NextRequest, NextResponse } from "next/server";
// Should be "@/app/lib/ai-service" not "@/lib/ai-service"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing AI service health...");

    const health = await aiService.healthCheck();

    if (!health.healthy) {
      return NextResponse.json(
        {
          success: false,
          message: "AI service health check failed",
          details: health,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI service is working!",
      data: {
        model: health.model,
        status: "healthy",
        note: "Using Hugging Face Inference API",
      },
    });
  } catch (error) {
    console.log("AI test error: ", error);

    return NextResponse.json(
      {
        success: false,
        message: "AI service test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        troubleshotting: [
          "1. Check HF_API_KEY in. .env.local file",
          "2. Get token from https://huggingface.co/settings/tokens",
          "3. Token needs WRITE role (not just Read)",
          "4. Make sure model exists: mistralia/<istral-7B-Instruct-v0.3",
        ],
      },
      { status: 500 }
    );
  }
}
