//backend/src/lib/bedrock.ts

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

/* ─────────────────────────────────────────────────────────── */
/*  Environment                                                */
/* ─────────────────────────────────────────────────────────── */

const REGION            = process.env.AWS_REGION            || "us-east-1";
const CHAT_MODEL_ID     = process.env.BEDROCK_MODEL_ID       || "anthropic.claude-3-haiku-20240307-v1:0";
const EMBED_MODEL_ID    = process.env.BEDROCK_EMBED_MODEL_ID || "amazon.titan-embed-text-v2:0";
const ACCESS_KEY_ID     = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.warn("⚠  AWS credentials not set. Bedrock calls will fail.");
}

/* ─────────────────────────────────────────────────────────── */
/*  Client                                                     */
/* ─────────────────────────────────────────────────────────── */

const client = new BedrockRuntimeClient({
  region: REGION,
  credentials: {
    accessKeyId:     ACCESS_KEY_ID     || "",
    secretAccessKey: SECRET_ACCESS_KEY || "",
  },
  maxAttempts:      3,       // ← retry up to 3 times
  requestHandler: {
    connectionTimeout: 10000,
    socketTimeout:     30000,
  } as any,
});

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                      */
/* ─────────────────────────────────────────────────────────── */

export interface ChatMessage {
  role:    "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  system?:      string;
  maxTokens?:   number;
  temperature?: number;
}

export interface ChatResponse {
  content:    string;
  inputTokens:  number;
  outputTokens: number;
  stopReason:   string;
}

export interface EmbeddingResponse {
  embedding:  number[];
  inputTokens: number;
}

/* ─────────────────────────────────────────────────────────── */
/*  Embeddings — Titan Embed v2                                */
/* ─────────────────────────────────────────────────────────── */

export async function generateEmbedding(
  text: string
): Promise<EmbeddingResponse> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot embed empty text");
  }

  // Titan has a token limit; truncate very long text
  const truncated = text.substring(0, 25000);

  const body = {
    inputText: truncated,
    dimensions: 1024,
    normalize:  true,
  };

  const command = new InvokeModelCommand({
    modelId:     EMBED_MODEL_ID,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify(body),
  });

  try {
    const response = await client.send(command);
    const result   = JSON.parse(new TextDecoder().decode(response.body));

    return {
      embedding:   result.embedding,
      inputTokens: result.inputTextTokenCount || 0,
    };
  } catch (error: any) {
    console.error("Embedding failed:", error.message);
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────── */
/*  Chat — Claude 3 Haiku                                      */
/* ─────────────────────────────────────────────────────────── */

export async function generateChat(
  messages: ChatMessage[],
  options:  ChatOptions = {}
): Promise<ChatResponse> {
  const {
    system      = "You are a helpful AI assistant.",
    maxTokens   = 1024,
    temperature = 0.7,
  } = options;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens:        maxTokens,
    temperature,
    system,
    messages,
  };

  const command = new InvokeModelCommand({
    modelId:     CHAT_MODEL_ID,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify(body),
  });

  try {
    const response = await client.send(command);
    const result   = JSON.parse(new TextDecoder().decode(response.body));

    return {
      content:      result.content[0]?.text || "",
      inputTokens:  result.usage?.input_tokens  || 0,
      outputTokens: result.usage?.output_tokens || 0,
      stopReason:   result.stop_reason           || "unknown",
    };
  } catch (error: any) {
    console.error("Chat generation failed:", error.message);
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────── */
/*  Batch Embeddings                                           */
/* ─────────────────────────────────────────────────────────── */

export async function generateEmbeddingsBatch(
  texts:     string[],
  onProgress?: (done: number, total: number) => void
): Promise<EmbeddingResponse[]> {
  const results: EmbeddingResponse[] = [];

  for (let i = 0; i < texts.length; i++) {
    const result = await generateEmbedding(texts[i]);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, texts.length);
    }

    // Small delay to avoid rate limits
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/* ─────────────────────────────────────────────────────────── */
/*  Export default                                             */
/* ─────────────────────────────────────────────────────────── */

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateChat,
};