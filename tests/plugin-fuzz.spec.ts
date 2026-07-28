// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { afterEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";
import { createHarness, jsonResponse, useResponses } from "./test-helpers.js";

describe("Xquik Paperclip plugin fuzz properties", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps arbitrary tweet IDs inside one encoded path segment", async () => {
    expect.assertions(1);
    let requestCount = 0;

    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 80 })
          .filter((value) => value.trim().length > 0)
          .filter((value) => value.trim() !== "." && value.trim() !== ".."),
        async (id) => {
          const requests = useResponses([jsonResponse({ tweet: { id } })]);
          const harness = createHarness();
          await plugin.definition.setup(harness.ctx);

          await harness.executeTool(TOOL_NAMES.lookupTweet, { id });

          assert.equal(requests.length, 1);
          const requestedUrl = new URL(requests[0]?.url ?? "");
          assert.equal(requestedUrl.origin, "https://xquik.com");
          assert.equal(requestedUrl.search, "");
          assert.equal(
            decodeURIComponent(requestedUrl.pathname.replace("/api/v1/x/tweets/", "")),
            id.trim(),
          );
          requestCount += 1;
        },
      ),
      { numRuns: 100 },
    );

    for (const id of [".", "..", " . ", " .. "]) {
      const harness = createHarness();
      await plugin.definition.setup(harness.ctx);
      const output = await harness.executeTool(TOOL_NAMES.lookupTweet, { id });
      assert.equal(output.error, "id must not be a dot path segment");
    }

    expect(requestCount).toBe(100);
  });
});
