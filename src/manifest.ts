// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_TREND_COUNT,
  PLUGIN_ID,
  PLUGIN_VERSION,
  TOOL_NAMES,
} from "./constants.js";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Xquik",
  description:
    "Adds Xquik X search, tweet, user, timeline, and trend tools for Paperclip agents. Not affiliated with X Corp.",
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
        title: "Xquik API Base URL",
        default: DEFAULT_API_BASE_URL,
      },
      apiKeySecretRef: {
        type: "string",
        title: "Xquik API Key Secret Reference",
        description: "Paperclip secret reference containing an Xquik API key.",
      },
      defaultSearchLimit: {
        type: "integer",
        title: "Default Search Limit",
        minimum: 1,
        maximum: 200,
        default: DEFAULT_SEARCH_LIMIT,
      },
      defaultTrendCount: {
        type: "integer",
        title: "Default Trend Count",
        minimum: 1,
        maximum: 50,
        default: DEFAULT_TREND_COUNT,
      },
    },
    required: ["apiKeySecretRef"],
  },
  tools: [
    {
      name: TOOL_NAMES.searchTweets,
      displayName: "Search X Tweets",
      description: "Search X tweets with X query operators through Xquik.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "X search query." },
          queryType: { type: "string", enum: ["Latest", "Top"], default: "Latest" },
          limit: { type: "integer", minimum: 1, maximum: 200 },
          cursor: { type: "string" },
          sinceTime: { type: "string" },
          untilTime: { type: "string" },
        },
        required: ["q"],
      },
    },
    {
      name: TOOL_NAMES.lookupTweet,
      displayName: "Lookup X Tweet",
      description: "Fetch a tweet by ID with full text, author, metrics, and media.",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Tweet ID." },
        },
        required: ["id"],
      },
    },
    {
      name: TOOL_NAMES.searchUsers,
      displayName: "Search X Users",
      description: "Search X users by name or username.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Name or username query." },
          cursor: { type: "string" },
        },
        required: ["q"],
      },
    },
    {
      name: TOOL_NAMES.getUser,
      displayName: "Get X User",
      description: "Fetch an X user profile by ID or username accepted by Xquik.",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID or username." },
        },
        required: ["id"],
      },
    },
    {
      name: TOOL_NAMES.getUserTweets,
      displayName: "Get X User Tweets",
      description: "List recent tweets posted by a user.",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID or username." },
          cursor: { type: "string" },
          includeReplies: { type: "boolean", default: false },
          includeParentTweet: { type: "boolean", default: false },
        },
        required: ["id"],
      },
    },
    {
      name: TOOL_NAMES.getTrends,
      displayName: "Get X Trends",
      description: "Fetch current X trending topics by WOEID.",
      parametersSchema: {
        type: "object",
        properties: {
          woeid: { type: "integer", default: 1 },
          count: { type: "integer", minimum: 1, maximum: 50 },
        },
      },
    },
  ],
};

export default manifest;
