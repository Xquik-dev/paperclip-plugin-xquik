// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_TREND_COUNT,
  MAX_SEARCH_LIMIT,
  MAX_TREND_COUNT,
  PLUGIN_ID,
  PLUGIN_VERSION,
} from "./constants.js";
import { TOOLS } from "./tools.js";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Xquik",
  description:
    "Paperclip plugin for Twitter search, tweet lookup, profiles, timelines & X trends. Not affiliated with X Corp.",
  author: "Xquik",
  categories: ["connector", "automation"],
  capabilities: ["http.outbound", "secrets.read-ref", "agent.tools.register"],
  entrypoints: {
    worker: "./dist/worker.js",
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      apiBaseUrl: {
        type: "string",
        title: "Xquik API URL",
        description: "Base URL for Xquik API requests.",
        default: DEFAULT_API_BASE_URL,
      },
      apiKeySecretRef: {
        type: "string",
        title: "Xquik API key secret",
        description: "Paperclip secret reference for the Xquik API key.",
      },
      defaultSearchLimit: {
        type: "integer",
        title: "Default tweet search limit",
        minimum: 1,
        maximum: MAX_SEARCH_LIMIT,
        default: DEFAULT_SEARCH_LIMIT,
      },
      defaultTrendCount: {
        type: "integer",
        title: "Default trend count",
        minimum: 1,
        maximum: MAX_TREND_COUNT,
        default: DEFAULT_TREND_COUNT,
      },
    },
    required: ["apiKeySecretRef"],
  },
  tools: Object.values(TOOLS),
};

export default manifest;
