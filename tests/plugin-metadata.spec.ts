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

  it("states the same version and description in the manifest, the package and the README", () => {
    expect.assertions(2);

    const packageMetadata: unknown = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

    expect(packageMetadata).toMatchObject({
      version: manifest.version,
      description: manifest.description,
    });
    expect(readme).toContain(
      `paperclipai plugin install @xquik/paperclip-plugin-xquik --version ${manifest.version}\n`,
    );
  });

  it("declares the API's tweet search limit and trend regions", () => {
    expect.assertions(3);

    const schemas = new Map(manifest.tools?.map((tool) => [tool.name, tool.parametersSchema]));

    expect(manifest.instanceConfigSchema).toMatchObject({
      properties: { defaultSearchLimit: { minimum: 1, maximum: 10000 } },
    });
    expect(schemas.get(TOOL_NAMES.searchTweets)).toMatchObject({
      properties: { limit: { minimum: 1, maximum: 10000 } },
    });
    expect(schemas.get(TOOL_NAMES.getTrends)).toMatchObject({
      properties: {
        woeid: { type: "integer" },
        country: { type: "string" },
        location: { type: "string" },
      },
    });
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
