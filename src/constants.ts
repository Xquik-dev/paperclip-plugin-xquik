// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

const PLUGIN_ID = "xquik.paperclip-plugin-xquik";
const PLUGIN_VERSION = "0.2.0";
const DEFAULT_API_BASE_URL = "https://xquik.com/api/v1";
const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 10_000;
const DEFAULT_TREND_COUNT = 10;
const MAX_TREND_COUNT = 50;

const TOOL_NAMES = {
  searchTweets: "xquik.search_tweets",
  lookupTweet: "xquik.lookup_tweet",
  searchUsers: "xquik.search_users",
  getUser: "xquik.get_user",
  getUserTweets: "xquik.get_user_tweets",
  getTrends: "xquik.get_trends",
} as const;

export {
  DEFAULT_API_BASE_URL,
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_TREND_COUNT,
  MAX_SEARCH_LIMIT,
  MAX_TREND_COUNT,
  PLUGIN_ID,
  PLUGIN_VERSION,
  TOOL_NAMES,
};
