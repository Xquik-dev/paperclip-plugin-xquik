// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import {
  definePlugin,
  runWorker,
  type PluginContext,
  type PluginHealthDiagnostics,
  type ToolResult,
} from "@paperclipai/plugin-sdk";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_TREND_COUNT,
  MAX_SEARCH_LIMIT,
  MAX_TREND_COUNT,
  TOOL_NAMES,
} from "./constants.js";
import { TOOLS } from "./tools.js";

interface ResolvedConfig {
  readonly apiBaseUrl: string;
  readonly apiKeySecretRef: string;
  readonly defaultSearchLimit: number;
  readonly defaultTrendCount: number;
}

interface TrendRegion {
  readonly woeid?: number;
  readonly country?: string;
  readonly location?: string;
}

type ToolParams = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is ToolParams {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function toParams(params: unknown): ToolParams {
  return isRecord(params) ? params : {};
}

let currentContext: PluginContext | null = null;

function asString(params: ToolParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asBoolean(params: ToolParams, key: string): boolean | undefined {
  const value = params[key];
  return typeof value === "boolean" ? value : undefined;
}

function asInteger(params: ToolParams, key: string, fallback: number, min: number, max: number): number {
  const raw = params[key];
  const value = typeof raw === "number" ? raw : Number(raw ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeBaseUrl(value: unknown): string {
  const raw = typeof value === "string" && value.trim().length > 0 ? value.trim() : DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/u, "");
}

function normalizeConfig(raw: Record<string, unknown>): ResolvedConfig {
  const { apiBaseUrl, apiKeySecretRef } = raw;
  return {
    apiBaseUrl: normalizeBaseUrl(apiBaseUrl),
    apiKeySecretRef: typeof apiKeySecretRef === "string" ? apiKeySecretRef.trim() : "",
    defaultSearchLimit: asInteger(raw, "defaultSearchLimit", DEFAULT_SEARCH_LIMIT, 1, MAX_SEARCH_LIMIT),
    defaultTrendCount: asInteger(raw, "defaultTrendCount", DEFAULT_TREND_COUNT, 1, MAX_TREND_COUNT),
  };
}

async function getConfig(ctx: PluginContext): Promise<ResolvedConfig> {
  return normalizeConfig(await ctx.config.get());
}

function errorMessage(body: unknown): string {
  if (isRecord(body)) {
    const message = body.message ?? body.error;
    if (typeof message === "string" && message.trim().length > 0) return message;
  }
  if (typeof body === "string" && body.trim().length > 0) return body.slice(0, 240);
  return "Request failed. Check the request and retry.";
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function xquikGet(
  ctx: PluginContext,
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  const config = await getConfig(ctx);
  if (!config.apiKeySecretRef) {
    throw new Error("Xquik API key is not configured. Add apiKeySecretRef.");
  }

  const apiKey = await ctx.secrets.resolve(config.apiKeySecretRef);
  const url = new URL(`${config.apiBaseUrl}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await ctx.http.fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    throw new Error(`Xquik request failed with status ${response.status}. ${errorMessage(body)}`);
  }
  return body;
}

function requireString(params: ToolParams, key: string): string | ToolResult {
  const value = asString(params, key);
  if (value !== undefined) return value;
  return { error: `${key} is required. Add ${key} and retry.` };
}

function requirePathSegment(params: ToolParams, key: string): string | ToolResult {
  const value = requireString(params, key);
  if (typeof value !== "string") return value;
  if (value === "." || value === "..") {
    return { error: `${key} cannot be "." or "..". Enter a valid ID.` };
  }
  return value;
}

function trendRegion(params: ToolParams): TrendRegion {
  const country = asString(params, "country");
  const location = asString(params, "location");
  const woeid = asInteger(params, "woeid", 0, 0, Number.MAX_SAFE_INTEGER);
  if (woeid > 0) return { woeid, country, location };
  if (country === undefined && location === undefined) return { woeid: 1 };
  return { country, location };
}

function countLabel(count: number | undefined, noun: string): string { return `${count ?? 0} ${noun}${count === 1 ? "" : "s"}`; }

function arrayCount(data: unknown, key: string): number | undefined {
  if (!isRecord(data)) return undefined;
  const value = data[key];
  return isList(value) ? value.length : undefined;
}

function pageSuffix(data: unknown): string {
  if (!isRecord(data)) return "";
  return data.has_next_page === true || typeof data.next_cursor === "string" ? " More results are available." : "";
}

async function registerTools(ctx: PluginContext): Promise<void> {
  ctx.tools.register(
    TOOLS.searchTweets.name,
    TOOLS.searchTweets,
    async (params): Promise<ToolResult> => {
      const payload = toParams(params);
      const q = requireString(payload, "q");
      if (typeof q !== "string") return q;
      const config = await getConfig(ctx);
      const data = await xquikGet(ctx, "/x/tweets/search", {
        q,
        queryType: asString(payload, "queryType") ?? "Latest",
        limit: asInteger(payload, "limit", config.defaultSearchLimit, 1, MAX_SEARCH_LIMIT),
        cursor: asString(payload, "cursor"),
        sinceTime: asString(payload, "sinceTime"),
        untilTime: asString(payload, "untilTime"),
      });
      const count = arrayCount(data, "tweets");
      return { content: `Found ${countLabel(count, "tweet")}.${pageSuffix(data)}`, data };
    },
  );

  ctx.tools.register(
    TOOLS.lookupTweet.name,
    TOOLS.lookupTweet,
    async (params): Promise<ToolResult> => {
      const payload = toParams(params);
      const id = requirePathSegment(payload, "id");
      if (typeof id !== "string") return id;
      const data = await xquikGet(ctx, `/x/tweets/${encodeURIComponent(id)}`, {});
      return { content: `Fetched tweet ${id}.`, data };
    },
  );

  ctx.tools.register(
    TOOLS.searchUsers.name,
    TOOLS.searchUsers,
    async (params): Promise<ToolResult> => {
      const payload = toParams(params);
      const q = requireString(payload, "q");
      if (typeof q !== "string") return q;
      const data = await xquikGet(ctx, "/x/users/search", {
        q,
        cursor: asString(payload, "cursor"),
      });
      const count = arrayCount(data, "users");
      return { content: `Found ${countLabel(count, "user")}.${pageSuffix(data)}`, data };
    },
  );

  ctx.tools.register(
    TOOLS.getUser.name,
    TOOLS.getUser,
    async (params): Promise<ToolResult> => {
      const payload = toParams(params);
      const id = requirePathSegment(payload, "id");
      if (typeof id !== "string") return id;
      const data = await xquikGet(ctx, `/x/users/${encodeURIComponent(id)}`, {});
      return { content: `Fetched user ${id}.`, data };
    },
  );

  ctx.tools.register(
    TOOLS.getUserTweets.name,
    TOOLS.getUserTweets,
    async (params): Promise<ToolResult> => {
      const payload = toParams(params);
      const id = requirePathSegment(payload, "id");
      if (typeof id !== "string") return id;
      const data = await xquikGet(ctx, `/x/users/${encodeURIComponent(id)}/tweets`, {
        cursor: asString(payload, "cursor"),
        includeReplies: asBoolean(payload, "includeReplies"),
        includeParentTweet: asBoolean(payload, "includeParentTweet"),
      });
      const count = arrayCount(data, "tweets");
      return { content: `Fetched ${countLabel(count, "tweet")} for ${id}.${pageSuffix(data)}`, data };
    },
  );

  ctx.tools.register(
    TOOLS.getTrends.name,
    TOOLS.getTrends,
    async (params): Promise<ToolResult> => {
      const payload = toParams(params);
      const config = await getConfig(ctx);
      const data = await xquikGet(ctx, "/x/trends", {
        ...trendRegion(payload),
        count: asInteger(payload, "count", config.defaultTrendCount, 1, MAX_TREND_COUNT),
      });
      const count = arrayCount(data, "trends");
      return { content: `Fetched ${countLabel(count, "trend")}.`, data };
    },
  );
}

const plugin = definePlugin({
  async setup(ctx): Promise<void> {
    currentContext = ctx;

    ctx.data.register("connection", async () => {
      const config = await getConfig(ctx);
      return {
        apiBaseUrl: config.apiBaseUrl,
        configured: config.apiKeySecretRef.length > 0,
        tools: Object.values(TOOL_NAMES),
      };
    });

    ctx.actions.register("test-connection", async () => {
      const data = await xquikGet(ctx, "/x/trends", { woeid: 1, count: 1 });
      return {
        ok: true,
        data,
      };
    });

    await registerTools(ctx);
  },

  async onHealth(): Promise<PluginHealthDiagnostics> {
    const ctx = currentContext;
    if (ctx === null) {
      return { status: "degraded", message: "Plugin worker has not started. Start the plugin." };
    }
    const config = await getConfig(ctx);
    return {
      status: config.apiKeySecretRef ? "ok" : "degraded",
      message: config.apiKeySecretRef ? "Xquik plugin is ready." : "Xquik API key is missing. Add apiKeySecretRef.",
      details: {
        apiBaseUrl: config.apiBaseUrl,
        tools: Object.values(TOOL_NAMES),
      },
    };
  },

  async onValidateConfig(config): Promise<{ ok: boolean; errors: string[]; warnings: string[] }> {
    const resolved = normalizeConfig(config);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!resolved.apiKeySecretRef) {
      errors.push("apiKeySecretRef is required. Add a Paperclip secret reference.");
    }
    try {
      new URL(resolved.apiBaseUrl);
    } catch {
      errors.push("apiBaseUrl is invalid. Enter a complete URL.");
    }
    if (!resolved.apiBaseUrl.endsWith("/api/v1")) {
      warnings.push("apiBaseUrl should end with /api/v1.");
    }
    return {
      ok: errors.length === 0,
      errors,
      warnings,
    };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
