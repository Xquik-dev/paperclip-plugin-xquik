// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";
import {
  createHarness,
  defaultConfig,
  jsonResponse,
  useResponses,
} from "./test-helpers.js";

describe("Xquik Paperclip plugin tools", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers connection data and searches tweets", async () => {
    expect.assertions(10);

    const requests = useResponses([
      jsonResponse({
        tweets: [{ id: "123", text: "hello" }],
        has_next_page: true,
        next_cursor: "cursor",
      }),
    ]);
    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    const connection = await harness.getData("connection");
    const output = await harness.executeTool(TOOL_NAMES.searchTweets, {
      q: " from:xquik ",
      queryType: null,
      cursor: "",
      sinceTime: "   ",
      untilTime: "2026-07-23T00:00:00Z",
    });
    const requestedUrl = new URL(requests[0]?.url ?? "");
    const requestedHeaders = new Headers(requests[0]?.init?.headers);

    expect(connection).toEqual({
      apiBaseUrl: "https://xquik.com/api/v1",
      configured: true,
      tools: Object.values(TOOL_NAMES),
    });
    expect(output.error).toBeUndefined();
    expect(output.content).toBe("Found 1 tweets. More results are available.");
    expect(output.data).toEqual({
      tweets: [{ id: "123", text: "hello" }],
      has_next_page: true,
      next_cursor: "cursor",
    });
    expect(requestedUrl.searchParams.get("q")).toBe("from:xquik");
    expect(requestedUrl.searchParams.get("queryType")).toBe("Latest");
    expect(requestedUrl.searchParams.get("limit")).toBe("7");
    expect(requestedUrl.searchParams.get("untilTime")).toBe("2026-07-23T00:00:00Z");
    expect(requestedUrl.searchParams.get("cursor")).toBeNull();
    expect(requestedHeaders.get("x-api-key")).toBe("resolved:XQUIK_API_KEY");
  });

  it("executes every read-only tool and connection action", async () => {
    expect.assertions(9);

    const requests = useResponses([
      new Response(null, { status: 200 }),
      new Response("plain text", { status: 200 }),
      jsonResponse({ user: { id: "user/name" } }),
      jsonResponse({ tweets: [{ id: "1" }, { id: "2" }], next_cursor: "next" }),
      jsonResponse({ trends: ["Open Source"] }),
      jsonResponse({ trends: [] }),
      jsonResponse({ trends: [] }),
    ]);
    const harness = createHarness({
      ...defaultConfig,
      apiBaseUrl: "https://xquik.com/api/v1///",
    });
    await plugin.definition.setup(harness.ctx);

    const tweet = await harness.executeTool(TOOL_NAMES.lookupTweet, {
      id: "id/with space",
    });
    const users = await harness.executeTool(TOOL_NAMES.searchUsers, {
      q: "alice",
      cursor: "",
    });
    const user = await harness.executeTool(TOOL_NAMES.getUser, {
      id: "user/name",
    });
    const timeline = await harness.executeTool(TOOL_NAMES.getUserTweets, {
      id: "user/name",
      cursor: "next",
      includeReplies: true,
      includeParentTweet: "false",
    });
    const clampedTrends = await harness.executeTool(TOOL_NAMES.getTrends, {
      woeid: 0,
      count: 100,
    });
    const numericTrends = await harness.executeTool(TOOL_NAMES.getTrends, {
      woeid: "2.9",
      count: "4.9",
    });
    const connection = await harness.performAction("test-connection");

    expect(tweet).toEqual({ content: "Fetched tweet id/with space.", data: null });
    expect(users).toEqual({ content: "Found 0 users.", data: "plain text" });
    expect(user).toEqual({
      content: "Fetched user user/name.",
      data: { user: { id: "user/name" } },
    });
    expect(timeline).toEqual({
      content: "Fetched 2 tweets for user/name. More results are available.",
      data: { tweets: [{ id: "1" }, { id: "2" }], next_cursor: "next" },
    });
    expect(clampedTrends).toEqual({
      content: "Fetched 1 trends.",
      data: { trends: ["Open Source"] },
    });
    expect(numericTrends).toEqual({
      content: "Fetched 0 trends.",
      data: { trends: [] },
    });
    expect(connection).toEqual({ ok: true, data: { trends: [] } });
    expect(requests.map(({ url }) => url)).toEqual([
      "https://xquik.com/api/v1/x/tweets/id%2Fwith%20space",
      "https://xquik.com/api/v1/x/users/search?q=alice",
      "https://xquik.com/api/v1/x/users/user%2Fname",
      "https://xquik.com/api/v1/x/users/user%2Fname/tweets?cursor=next&includeReplies=true",
      "https://xquik.com/api/v1/x/trends?woeid=1&count=50",
      "https://xquik.com/api/v1/x/trends?woeid=2&count=4",
      "https://xquik.com/api/v1/x/trends?woeid=1&count=1",
    ]);
    expect(
      requests.every(
        ({ init }) => new Headers(init?.headers).get("x-api-key") === "resolved:XQUIK_API_KEY",
      ),
    ).toBe(true);
  });
});
