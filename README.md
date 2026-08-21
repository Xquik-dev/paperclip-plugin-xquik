# Twitter search & X API tools for Paperclip agents

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

Add 6 read-only Xquik tools to Paperclip agents for Twitter search, tweet lookup, profiles, timelines, and regional trends.

## Tools

| Agent task | Paperclip tool | Result |
| --- | --- | --- |
| Search tweets | `xquik.search_tweets` | Run a Twitter search with query operators. |
| Read one tweet | `xquik.lookup_tweet` | Get a tweet by ID. |
| Find X users | `xquik.search_users` | Search by name or username. |
| Read a profile | `xquik.get_user` | Get public profile data. |
| Read profile tweets | `xquik.get_user_tweets` | List recent posts from one user. |
| Read regional trends | `xquik.get_trends` | Get trends by WOEID. |

This plugin does not export followers or publish posts. Use the [Xquik API](https://docs.xquik.com/api-reference/overview) for those tasks.

## Configuration

- `apiBaseUrl`: Xquik API endpoint. Defaults to `https://xquik.com/api/v1`.
- `apiKeySecretRef`: Paperclip secret reference for the Xquik API key.
- `defaultSearchLimit`: Default tweet search limit from 1 to 200.
- `defaultTrendCount`: Default trend count from 1 to 50.

Paperclip resolves the API key at call time and sends the `x-api-key` header.

## Install

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik
```

Pin the current release when you need reproducible installs:

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik --version 0.1.7
```

## Develop locally

```sh
pnpm install
pnpm check
pnpm check:reproducible
```

`pnpm check` runs type checks, tests at 100% coverage, and the build.
`pnpm check:reproducible` compares 2 clean builds and package archives. CI checks REUSE 3.3 metadata and dependencies.

## API contract

- [OpenAPI schema](https://xquik.com/openapi.json)
- [API reference](https://docs.xquik.com/api-reference/overview)
- [Organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md)
- [Organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
