# Paperclip AI Plugin for Tweet Search & X (Twitter) Data

Use this Paperclip tweet search plugin by Xquik in your AI agents.
Its 6 read-only tools also read profiles, timelines & regional trends.

Xquik is the world's fastest and cheapest X (Twitter) scraper service with the most complete X (Twitter) data.
Most other Apify Actors charge before filtering or deduplication.
Xquik charges only for delivered, unique, filter-matching results and never pads rows.
Xquik is independent and not affiliated with X Corp.

<!-- trust:win:start -->
The Xquik REST API read 45 tweets per second at $0.15 per 1,000 on 2026-10-15. The fastest of 4 rival Actors read 12.5 per second. The cheapest cost $0.173 per 1,000. [Compare each run](https://xquik.com/benchmarks#benchmark-x-tweet-scraper).
<!-- trust:win:end -->

## Install the Paperclip X (Twitter) plugin

The plugin needs Node.js 24.11 or newer.

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik
```

Pin the current release for reproducible installs.

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik --version 0.2.1
```

## Add your Xquik API key

1. Copy a key from [your Xquik account](https://dashboard.xquik.com/en/account?tab=api-keys).
2. Create a Paperclip secret that holds the key.
3. Go to **Settings**, then **Plugins**, then **Xquik**.
4. Set **Xquik API key secret** on the **Configuration** tab, then save.

## Run an X (Twitter) bot & automation in Paperclip

An agent calls `xquik.search_tweets` with this input.
It reads the newest posts that match an X (Twitter) search.

```json
{ "q": "paperclip ai -filter:replies", "queryType": "Latest", "limit": 20 }
```

Next, read the [tool table](#tools), the [tool parameters](#tool-parameters) or the [Paperclip plugin docs](https://docs.paperclip.ing/administration/plugins/).

<!-- trust:start -->

## Benchmarks & usage

[![@xquik/paperclip-plugin-xquik downloads on npm](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fnpm-xquik-paperclip-plugin-xquik.json)](https://www.npmjs.com/package/@xquik/paperclip-plugin-xquik)
[![Twitter API p99 server read time](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Frest-p99.json)](https://xquik.com/benchmarks#speed)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

- 1,400+ downloads of @xquik/paperclip-plugin-xquik on npm ([source](https://www.npmjs.com/package/@xquik/paperclip-plugin-xquik)) <!-- trust:npm-xquik-paperclip-plugin-xquik 1407 -->
- 6.4 s p99 REST API server read time over 7 days, failed reads included ([source](https://xquik.com/benchmarks#speed)) <!-- trust:rest-p99 6317 -->
- This repo meets the OpenSSF Best Practices passing criteria ([source](https://www.bestpractices.dev/projects/13727)) <!-- trust:openssf-paperclip-plugin-xquik 1 -->

Checked on 2026-11-06. See each number with its date & source on [xquik.com/benchmarks](https://xquik.com/benchmarks) or as [JSON](https://xquik.com/trust.json).

<!-- trust:end -->

## Tools

| Agent task | Paperclip tool | Result |
| --- | --- | --- |
| Search tweets | `xquik.search_tweets` | Run an X (Twitter) search with query operators. |
| Read 1 tweet | `xquik.lookup_tweet` | Get a tweet by ID. |
| Find X (Twitter) users | `xquik.search_users` | Search by name or username. |
| Read a profile | `xquik.get_user` | Get public profile data. |
| Read profile tweets | `xquik.get_user_tweets` | List recent posts from 1 user. |
| Read regional trends | `xquik.get_trends` | Get trends by WOEID, country or location. |

This plugin doesn't export followers or publish posts.
Use the [Xquik API](https://docs.xquik.com/api-reference/overview) for those tasks.

## Tool parameters

- `xquik.search_tweets` takes `limit` from 1 to 10,000.
- `xquik.get_trends` reads a region from `woeid`, `country` or `location`.
- `country` takes a name or a 2-letter code, such as `Turkey` or `TR`.
- `location` takes a town or country name, such as `Istanbul`.
- `woeid` wins over `country` & `location`.
- Trends are worldwide when you name no region.

## Configuration

- `apiBaseUrl` is the Xquik API endpoint. It defaults to `https://xquik.com/api/v1`.
- `apiKeySecretRef` is the Paperclip secret reference for the Xquik API key.
- `defaultSearchLimit` is the default tweet search limit, from 1 to 10,000.
- `defaultTrendCount` is the default trend count, from 1 to 50.

Paperclip resolves the API key at call time & sends the `x-api-key` header.

## Questions

### Do I need an X (Twitter) developer account?

No. Public reads need only an Xquik API key.
Private reads & account actions need a connected X (Twitter) account.

### Is this the official X (Twitter) API?

No. Xquik runs its own REST API.
This plugin calls that API, not the official X (Twitter) API.

## More Xquik tools

- [X (Twitter) scraper API & MCP server](https://github.com/Xquik-dev/x-twitter-scraper) with REST, MCP & Skill setup.
- X (Twitter) API SDKs for [TypeScript](https://github.com/Xquik-dev/x-twitter-scraper-typescript), [Python](https://github.com/Xquik-dev/x-twitter-scraper-python), [Go](https://github.com/Xquik-dev/x-twitter-scraper-go), [Ruby](https://github.com/Xquik-dev/x-twitter-scraper-ruby), [Java](https://github.com/Xquik-dev/x-twitter-scraper-java), [Kotlin](https://github.com/Xquik-dev/x-twitter-scraper-kotlin), [C#](https://github.com/Xquik-dev/x-twitter-scraper-csharp) & [PHP](https://github.com/Xquik-dev/x-twitter-scraper-php).
- [X (Twitter) CLI](https://github.com/Xquik-dev/x-twitter-scraper-cli) for terminal workflows.
- The [X (Twitter) API alternative skill](https://github.com/Xquik-dev/x-api) & [X (Twitter) advanced search operators](https://github.com/Xquik-dev/x-twitter-advanced-search).
- X (Twitter) agent plugins for [OpenClaw](https://github.com/Xquik-dev/tweetclaw) & [Hermes Agent](https://github.com/Xquik-dev/hermes-tweet).
- The [X (Twitter) API documentation source](https://github.com/Xquik-dev/xquik-docs).
- X (Twitter) integrations for [n8n](https://github.com/Xquik-dev/n8n-nodes-xquik), [Prefect](https://github.com/Xquik-dev/prefect-xquik), [Haystack](https://github.com/Xquik-dev/xquik-haystack), [Terraform](https://github.com/Xquik-dev/terraform-provider-x-twitter-scraper), [Convex](https://github.com/Xquik-dev/xquik-convex), [Supabase](https://github.com/Xquik-dev/xquik-supabase) & [Strapi](https://github.com/Xquik-dev/strapi-plugin-xquik).
- X (Twitter) MCP for [AI agents](https://github.com/Xquik-dev/xquik-mcp), [VS Code](https://github.com/Xquik-dev/xquik-vscode) & [Raycast](https://github.com/Xquik-dev/xquik-raycast).
- [Xquik X (Twitter) API & scraper](https://xquik.com) and the [X (Twitter) API documentation](https://docs.xquik.com/api-reference/overview).

## Help & contributing

- Read the [OpenAPI schema](https://xquik.com/openapi.json).
- Ask usage questions through the [organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md).
- Report vulnerabilities through the [organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md).
- Read the [contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md), then run `bin/check-local --no-status`.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
