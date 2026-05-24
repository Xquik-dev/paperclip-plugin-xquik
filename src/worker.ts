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
  TOOL_NAMES,
} from "./constants.js";

interface XquikConfig {
  readonly apiBaseUrl?: string;
  readonly apiKeySecretRef?: string;
  readonly defaultSearchLimit?: number;
  readonly defaultTrendCount?: number;
}

interface ResolvedConfig {
  readonly apiBaseUrl: string;
  readonly apiKeySecretRef: string;
  readonly defaultSearchLimit: number;
  readonly defaultTrendCount: number;
}

type ToolParams = Record<string, unknown>;

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
  const config = raw as XquikConfig;
  return {
    apiBaseUrl: normalizeBaseUrl(config.apiBaseUrl),
    apiKeySecretRef: typeof config.apiKeySecretRef === "string" ? config.apiKeySecretRef.trim() : "",
    defaultSearchLimit: asInteger(raw, "defaultSearchLimit", DEFAULT_SEARCH_LIMIT, 1, 200),
    defaultTrendCount: asInteger(raw, "defaultTrendCount", DEFAULT_TREND_COUNT, 1, 50),
  };
}

async function getConfig(ctx: PluginContext): Promise<ResolvedConfig> {
  return normalizeConfig(await ctx.config.get());
}

function appendParam(url: URL, key: string, value: string | number | boolean | undefined): void {
  if (value === undefined) return;
  url.searchParams.set(key, String(value));
}

function errorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.error;
    if (typeof message === "string" && message.trim().length > 0) return message;
  }
  if (typeof body === "string" && body.trim().length > 0) return body.slice(0, 240);
  return "Request failed";
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
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
    throw new Error("Xquik API key secret reference is not configured");
  }

  const apiKey = await ctx.secrets.resolve(config.apiKeySecretRef);
  const url = new URL(`${config.apiBaseUrl}${endpoint}`);
  for (const [key, value] of Object.entries(params)) appendParam(url, key, value);

  const response = await ctx.http.fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    throw new Error(`Xquik request failed with status ${response.status}: ${errorMessage(body)}`);
  }
  return body;
}

function requireString(params: ToolParams, key: string): string | ToolResult {
  const value = asString(params, key);
  if (value !== undefined) return value;
  return { error: `${key} is required` };
}

function result(content: string, data: unknown): ToolResult {
  return { content, data };
}

function arrayCount(data: unknown, key: string): number | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const value = (data as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.length : undefined;
}

function pageSuffix(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const record = data as Record<string, unknown>;
  return record.has_next_page === true || typeof record.next_cursor === "string" ? " More results are available." : "";
}

async function registerTools(ctx: PluginContext): Promise<void> {
  ctx.tools.register(
    TOOL_NAMES.searchTweets,
    {
      displayName: "Search X Tweets",
      description: "Search X tweets with X query operators through Xquik.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string" },
          queryType: { type: "string", enum: ["Latest", "Top"] },
          limit: { type: "integer", minimum: 1, maximum: 200 },
          cursor: { type: "string" },
          sinceTime: { type: "string" },
          untilTime: { type: "string" },
        },
        required: ["q"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const q = requireString(payload, "q");
      if (typeof q !== "string") return q;
      const config = await getConfig(ctx);
      const data = await xquikGet(ctx, "/x/tweets/search", {
        q,
        queryType: asString(payload, "queryType") ?? "Latest",
        limit: asInteger(payload, "limit", config.defaultSearchLimit, 1, 200),
        cursor: asString(payload, "cursor"),
        sinceTime: asString(payload, "sinceTime"),
        untilTime: asString(payload, "untilTime"),
      });
      const count = arrayCount(data, "tweets");
      return result(`Found ${count ?? 0} tweets.${pageSuffix(data)}`, data);
    },
  );

  ctx.tools.register(
    TOOL_NAMES.lookupTweet,
    {
      displayName: "Lookup X Tweet",
      description: "Fetch a tweet by ID with full text, author, metrics, and media.",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const id = requireString(payload, "id");
      if (typeof id !== "string") return id;
      const data = await xquikGet(ctx, `/x/tweets/${encodeURIComponent(id)}`, {});
      return result(`Fetched tweet ${id}.`, data);
    },
  );

  ctx.tools.register(
    TOOL_NAMES.searchUsers,
    {
      displayName: "Search X Users",
      description: "Search X users by name or username.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string" },
          cursor: { type: "string" },
        },
        required: ["q"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const q = requireString(payload, "q");
      if (typeof q !== "string") return q;
      const data = await xquikGet(ctx, "/x/users/search", {
        q,
        cursor: asString(payload, "cursor"),
      });
      const count = arrayCount(data, "users");
      return result(`Found ${count ?? 0} users.${pageSuffix(data)}`, data);
    },
  );

  ctx.tools.register(
    TOOL_NAMES.getUser,
    {
      displayName: "Get X User",
      description: "Fetch an X user profile by ID or username accepted by Xquik.",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const id = requireString(payload, "id");
      if (typeof id !== "string") return id;
      const data = await xquikGet(ctx, `/x/users/${encodeURIComponent(id)}`, {});
      return result(`Fetched user ${id}.`, data);
    },
  );

  ctx.tools.register(
    TOOL_NAMES.getUserTweets,
    {
      displayName: "Get X User Tweets",
      description: "List recent tweets posted by a user.",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          cursor: { type: "string" },
          includeReplies: { type: "boolean" },
          includeParentTweet: { type: "boolean" },
        },
        required: ["id"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const id = requireString(payload, "id");
      if (typeof id !== "string") return id;
      const data = await xquikGet(ctx, `/x/users/${encodeURIComponent(id)}/tweets`, {
        cursor: asString(payload, "cursor"),
        includeReplies: asBoolean(payload, "includeReplies"),
        includeParentTweet: asBoolean(payload, "includeParentTweet"),
      });
      const count = arrayCount(data, "tweets");
      return result(`Fetched ${count ?? 0} tweets for ${id}.${pageSuffix(data)}`, data);
    },
  );

  ctx.tools.register(
    TOOL_NAMES.getTrends,
    {
      displayName: "Get X Trends",
      description: "Fetch current X trending topics by WOEID.",
      parametersSchema: {
        type: "object",
        properties: {
          woeid: { type: "integer" },
          count: { type: "integer", minimum: 1, maximum: 50 },
        },
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const config = await getConfig(ctx);
      const data = await xquikGet(ctx, "/x/trends", {
        woeid: asInteger(payload, "woeid", 1, 1, 999999),
        count: asInteger(payload, "count", config.defaultTrendCount, 1, 50),
      });
      const count = arrayCount(data, "trends");
      return result(`Fetched ${count ?? 0} trends.`, data);
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
      return { status: "degraded", message: "Plugin worker has not started" };
    }
    const config = await getConfig(ctx);
    return {
      status: config.apiKeySecretRef ? "ok" : "degraded",
      message: config.apiKeySecretRef ? "Xquik plugin ready" : "Configure an Xquik API key secret reference",
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
      errors.push("apiKeySecretRef is required");
    }
    try {
      new URL(resolved.apiBaseUrl);
    } catch {
      errors.push("apiBaseUrl must be a valid URL");
    }
    if (!resolved.apiBaseUrl.endsWith("/api/v1")) {
      warnings.push("apiBaseUrl should usually end with /api/v1");
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
