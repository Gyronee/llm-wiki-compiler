/**
 * Tests for OpenAI-compatible provider-specific chat completion fields.
 */

import { describe, it, expect } from "vitest";
import { OpenAIProvider } from "../src/providers/openai.js";

type ChatCall = Record<string, unknown>;

function stubChatClient(provider: OpenAIProvider, response: unknown): ChatCall[] {
  const calls: ChatCall[] = [];
  Reflect.set(provider, "client", {
    chat: {
      completions: {
        create: async (params: ChatCall) => {
          calls.push(params);
          return response;
        },
      },
    },
  });
  return calls;
}

describe("OpenAIProvider completionExtraBody", () => {
  it("adds provider-specific fields to regular completions", async () => {
    const provider = new OpenAIProvider("deepseek-v4-flash", {
      apiKey: "test-key",
      completionExtraBody: { thinking: { type: "disabled" } },
    });
    const calls = stubChatClient(provider, {
      choices: [{ message: { content: "ok" } }],
    });

    const result = await provider.complete("system", [{ role: "user", content: "hello" }], 128);

    expect(result).toBe("ok");
    expect(calls[0]).toMatchObject({
      model: "deepseek-v4-flash",
      max_tokens: 128,
      thinking: { type: "disabled" },
    });
  });

  it("adds provider-specific fields to tool calls", async () => {
    const provider = new OpenAIProvider("deepseek-v4-flash", {
      apiKey: "test-key",
      completionExtraBody: { thinking: { type: "disabled" } },
    });
    const calls = stubChatClient(provider, {
      choices: [{
        message: {
          tool_calls: [{ function: { arguments: '{"concepts":[]}' } }],
        },
      }],
    });

    const result = await provider.toolCall(
      "system",
      [{ role: "user", content: "extract" }],
      [{ name: "extract", description: "Extract concepts", input_schema: { type: "object" } }],
      256,
    );

    expect(result).toBe('{"concepts":[]}');
    expect(calls[0]).toMatchObject({
      model: "deepseek-v4-flash",
      max_tokens: 256,
      thinking: { type: "disabled" },
      tool_choice: "required",
    });
    expect(calls[0].tools).toEqual([
      {
        type: "function",
        function: {
          name: "extract",
          description: "Extract concepts",
          parameters: { type: "object" },
        },
      },
    ]);
  });
});
