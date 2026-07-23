// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { vi } from "vitest";
import { createTestHarness, type TestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";

interface RecordedRequest {
  readonly init: RequestInit | undefined;
  readonly url: string;
}

const defaultConfig = {
  apiBaseUrl: "https://xquik.com/api/v1",
  apiKeySecretRef: "XQUIK_API_KEY",
  defaultSearchLimit: 7,
  defaultTrendCount: 3,
};

function createHarness(config: Record<string, unknown> = defaultConfig): TestHarness {
  return createTestHarness({
    manifest,
    config,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function useResponses(responses: readonly Response[]): RecordedRequest[] {
  const remaining = [...responses];
  const requests: RecordedRequest[] = [];

  vi.stubGlobal(
    "fetch",
    async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const response = remaining.shift();
      if (response === undefined) {
        throw new Error("No test response remains");
      }
      requests.push({ init, url: String(input) });
      return response;
    },
  );

  return requests;
}

export { createHarness, defaultConfig, jsonResponse, useResponses };
export type { RecordedRequest };
