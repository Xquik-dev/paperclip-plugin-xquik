import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";

function createHarness(): ReturnType<typeof createTestHarness> {
  return createTestHarness({
    manifest,
    config: {
      apiBaseUrl: "https://xquik.com/api/v1",
      apiKeySecretRef: "XQUIK_API_KEY",
      defaultSearchLimit: 7,
      defaultTrendCount: 3,
    },
  });
}

describe("Xquik Paperclip plugin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("declares host capabilities and agent tools", () => {
    expect.assertions(4);

    expect(manifest.capabilities).toContain("http.outbound");
    expect(manifest.capabilities).toContain("secrets.read-ref");
    expect(manifest.capabilities).toContain("agent.tools.register");
    expect(manifest.tools?.map((tool) => tool.name)).toEqual(Object.values(TOOL_NAMES));
  });

  it("validates required configuration", async () => {
    expect.assertions(4);

    const invalid = await plugin.definition.onValidateConfig?.({});
    const valid = await plugin.definition.onValidateConfig?.({
      apiBaseUrl: "https://xquik.com/api/v1",
      apiKeySecretRef: "XQUIK_API_KEY",
    });

    expect(invalid?.ok).toBe(false);
    expect(invalid?.errors).toContain("apiKeySecretRef is required");
    expect(valid?.ok).toBe(true);
    expect(valid?.errors).toEqual([]);
  });

  it("registers connection data and calls Xquik through the host HTTP client", async () => {
    expect.assertions(8);

    let requestedUrl = "";
    let requestedHeader = "";
    vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      requestedUrl = String(input);
      requestedHeader = new Headers(init?.headers).get("x-api-key") ?? "";
      return new Response(JSON.stringify({
        tweets: [
          {
            id: "123",
            text: "hello",
          },
        ],
        has_next_page: true,
        next_cursor: "cursor",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    const connection = await harness.getData<{ configured: boolean; tools: string[] }>("connection");
    const output = await harness.executeTool(TOOL_NAMES.searchTweets, { q: "from:xquik" });

    expect(connection.configured).toBe(true);
    expect(connection.tools).toContain(TOOL_NAMES.searchTweets);
    expect(output.error).toBeUndefined();
    expect(output.content).toBe("Found 1 tweets. More results are available.");
    expect(output.data).toEqual({
      tweets: [{ id: "123", text: "hello" }],
      has_next_page: true,
      next_cursor: "cursor",
    });
    expect(requestedUrl).toContain("/x/tweets/search?");
    expect(requestedUrl).toContain("limit=7");
    expect(requestedHeader).toBe("resolved:XQUIK_API_KEY");
  });

  it("returns tool errors for missing required parameters", async () => {
    expect.assertions(2);

    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    const output = await harness.executeTool(TOOL_NAMES.lookupTweet, {});

    expect(output.content).toBeUndefined();
    expect(output.error).toBe("id is required");
  });
});
