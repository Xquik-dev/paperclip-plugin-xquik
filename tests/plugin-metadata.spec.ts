// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";
import { createHarness } from "./test-helpers.js";

describe("Xquik Paperclip plugin metadata", () => {
  it("explains how to recover when the worker has not started", async () => {
    expect.assertions(1);

    await expect(plugin.definition.onHealth?.()).resolves.toEqual({
      status: "degraded",
      message: "Plugin worker has not started. Start the plugin.",
    });
  });

  it("lists every host capability and agent tool", () => {
    expect.assertions(5);

    expect(manifest.capabilities).toContain("http.outbound");
    expect(manifest.capabilities).toContain("secrets.read-ref");
    expect(manifest.capabilities).toContain("agent.tools.register");
    expect(manifest.description).toContain("Not affiliated with X Corp.");
    expect(manifest.tools?.map((tool) => tool.name)).toEqual(Object.values(TOOL_NAMES));
  });

  it("matches the manifest version to the package version", () => {
    expect.assertions(1);

    const packageMetadata = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version: string };

    expect(manifest.version).toBe(packageMetadata.version);
  });

  it("checks reproducibility in pull requests and releases", () => {
    expect.assertions(3);

    const packageMetadata = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { scripts: Record<string, string> };
    const ciWorkflow = readFileSync(
      new URL("../.github/workflows/ci.yml", import.meta.url),
      "utf8",
    );
    const publishWorkflow = readFileSync(
      new URL("../.github/workflows/publish.yml", import.meta.url),
      "utf8",
    );

    expect(packageMetadata.scripts["check:reproducible"]).toBe(
      "node ./scripts/check-reproducible.mjs",
    );
    expect(ciWorkflow).toContain("run: pnpm check:reproducible");
    expect(publishWorkflow).toContain("run: pnpm check:reproducible");
  });

  it("reports invalid configuration with a fix", async () => {
    expect.assertions(5);

    const missing = await plugin.definition.onValidateConfig?.({});
    const invalid = await plugin.definition.onValidateConfig?.({
      apiBaseUrl: "not a URL",
      apiKeySecretRef: "   ",
    });
    const proxy = await plugin.definition.onValidateConfig?.({
      apiBaseUrl: " https://proxy.example.test/// ",
      apiKeySecretRef: " key ",
    });
    const defaultUrl = await plugin.definition.onValidateConfig?.({
      apiBaseUrl: 42,
      apiKeySecretRef: "key",
    });
    const emptyUrl = await plugin.definition.onValidateConfig?.({
      apiBaseUrl: "",
      apiKeySecretRef: "key",
    });

    expect(missing).toEqual({
      ok: false,
      errors: ["apiKeySecretRef is required. Add a Paperclip secret reference."],
      warnings: [],
    });
    expect(invalid).toEqual({
      ok: false,
      errors: [
        "apiKeySecretRef is required. Add a Paperclip secret reference.",
        "apiBaseUrl is invalid. Enter a complete URL.",
      ],
      warnings: ["apiBaseUrl should end with /api/v1."],
    });
    expect(proxy).toEqual({
      ok: true,
      errors: [],
      warnings: ["apiBaseUrl should end with /api/v1."],
    });
    expect(defaultUrl).toEqual({ ok: true, errors: [], warnings: [] });
    expect(emptyUrl).toEqual({ ok: true, errors: [], warnings: [] });
  });

  it("reports ready and missing-key states", async () => {
    expect.assertions(2);

    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    await expect(plugin.definition.onHealth?.()).resolves.toEqual({
      status: "ok",
      message: "Xquik plugin is ready.",
      details: {
        apiBaseUrl: "https://xquik.com/api/v1",
        tools: Object.values(TOOL_NAMES),
      },
    });

    harness.setConfig({
      apiBaseUrl: "https://xquik.com/api/v1/",
      apiKeySecretRef: "",
      defaultTrendCount: Number.POSITIVE_INFINITY,
    });

    await expect(plugin.definition.onHealth?.()).resolves.toEqual({
      status: "degraded",
      message: "Xquik API key is missing. Add apiKeySecretRef.",
      details: {
        apiBaseUrl: "https://xquik.com/api/v1",
        tools: Object.values(TOOL_NAMES),
      },
    });
  });
});
