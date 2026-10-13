// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import type { PluginToolDeclaration } from "@paperclipai/plugin-sdk";
import { MAX_SEARCH_LIMIT, MAX_TREND_COUNT, TOOL_NAMES } from "./constants.js";

// The manifest lists these declarations, and the worker registers each handler
// with the same object, so the 2 cannot differ.
const TOOLS = {
  searchTweets: {
    name: TOOL_NAMES.searchTweets,
    displayName: "Search tweets",
    description: "Search tweets with Twitter search operators through Xquik.",
    parametersSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Twitter search query with supported operators." },
        queryType: { type: "string", enum: ["Latest", "Top"], default: "Latest", description: "Sort by latest or top results." },
        limit: { type: "integer", minimum: 1, maximum: MAX_SEARCH_LIMIT, description: "Maximum tweets to return." },
        cursor: { type: "string", description: "Cursor from the previous page." },
        sinceTime: { type: "string", description: "Earliest tweet time in ISO 8601 format." },
        untilTime: { type: "string", description: "Latest tweet time in ISO 8601 format." },
      },
      required: ["q"],
    },
  },
  lookupTweet: {
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
  searchUsers: {
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
  getUser: {
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
  getUserTweets: {
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
  getTrends: {
    name: TOOL_NAMES.getTrends,
    displayName: "Get trends",
    description: "Get current X trending topics by WOEID, country, or location. No region means worldwide.",
    parametersSchema: {
      type: "object",
      properties: {
        woeid: { type: "integer", minimum: 1, description: "Where On Earth ID of the region, such as 23424977 for the US. It wins over country & location." },
        country: { type: "string", description: "Country name or 2-letter code, such as Turkey or TR." },
        location: { type: "string", description: "Town or country name, such as Istanbul. Add country when 2 towns share a name." },
        count: { type: "integer", minimum: 1, maximum: MAX_TREND_COUNT, description: "Maximum trends to return." },
      },
    },
  },
} satisfies Record<keyof typeof TOOL_NAMES, PluginToolDeclaration>;

export { TOOLS };
