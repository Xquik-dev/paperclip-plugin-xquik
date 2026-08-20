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
    "Search tweets, read profiles and timelines, and track X API trends from Paperclip. Not affiliated with X Corp.",
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
        maximum: 200,
        default: DEFAULT_SEARCH_LIMIT,
      },
      defaultTrendCount: {
        type: "integer",
        title: "Default trend count",
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
      displayName: "Search tweets",
      description: "Search tweets with Twitter search operators through Xquik.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Twitter search query with supported operators." },
          queryType: { type: "string", enum: ["Latest", "Top"], default: "Latest", description: "Result order." },
          limit: { type: "integer", minimum: 1, maximum: 200, description: "Maximum tweets to return." },
          cursor: { type: "string", description: "Cursor from the previous page." },
          sinceTime: { type: "string", description: "Earliest tweet time in ISO 8601 format." },
          untilTime: { type: "string", description: "Latest tweet time in ISO 8601 format." },
        },
        required: ["q"],
      },
    },
    {
      name: TOOL_NAMES.lookupTweet,
      displayName: "Get tweet",
      description: "Get a tweet by ID with its text, author, metrics, and media.",
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
      displayName: "Search users",
      description: "Search X profiles by name or username.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Profile name or username." },
          cursor: { type: "string", description: "Cursor from the previous page." },
        },
        required: ["q"],
      },
    },
    {
      name: TOOL_NAMES.getUser,
      displayName: "Get user profile",
      description: "Get an X profile by user ID or username.",
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
      displayName: "Get user tweets",
      description: "List recent tweets from one X user.",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID or username." },
          cursor: { type: "string", description: "Cursor from the previous page." },
          includeReplies: { type: "boolean", default: false, description: "Include replies from the user." },
          includeParentTweet: { type: "boolean", default: false, description: "Include each reply's parent tweet." },
        },
        required: ["id"],
      },
    },
    {
      name: TOOL_NAMES.getTrends,
      displayName: "Get trends",
      description: "Get current X trending topics by WOEID.",
      parametersSchema: {
        type: "object",
        properties: {
          woeid: { type: "integer", default: 1, description: "Yahoo Where On Earth ID for the region." },
          count: { type: "integer", minimum: 1, maximum: 50, description: "Maximum trends to return." },
        },
      },
    },
  ],
};

export default manifest;
