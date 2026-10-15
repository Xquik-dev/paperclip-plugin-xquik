# Paperclip AI plugin for Twitter search & X data

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

[Xquik](https://xquik.com) is the world's fastest and cheapest X Twitter scraper service with the most complete X data.
Xquik charges only for delivered, unique, filter-matching results & never pads rows.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

This plugin adds 6 read-only Xquik tools to Paperclip AI agents.
They cover Twitter search, tweet lookup, profiles, timelines & regional trends.

<!-- trust:start -->

## Trust & usage

[![Twitter API package downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fdownloads.json)](https://xquik.com/trust#downloads)
[![Twitter scraper users on Apify](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fapify-users.json)](https://apify.com/xquik)
[![Twitter scraper runs on Apify](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fapify-runs.json)](https://apify.com/xquik)
[![Tweet scraper rating on Apify](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fapify-rating.json)](https://apify.com/xquik/x-tweet-scraper/reviews)
[![Xquik Twitter API accounts](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Faccounts.json)](https://xquik.com/trust#accounts)
[![Twitter Skill installs](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fskill-installs.json)](https://xquik.com/trust#skill-installs)
[![Xquik verified revenue on TrustMRR](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Frevenue.json)](https://trustmrr.com/startup/xquik)
[![Twitter API median response time](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Frest-p50.json)](https://xquik.com/trust#speed)
[![Xquik GitHub stars](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fgithub-stars.json)](https://github.com/Xquik-dev)
[![@xquik/paperclip-plugin-xquik downloads on npm](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fnpm-xquik-paperclip-plugin-xquik.json)](https://www.npmjs.com/package/@xquik/paperclip-plugin-xquik)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

- 51,000+ downloads of Xquik's Twitter API packages on npm, PyPI, RubyGems, NuGet, Packagist & Terraform ([source](https://xquik.com/trust#downloads)) <!-- trust:downloads 51020 -->
- 7,800+ users of Xquik's Twitter scraper Actors on Apify ([source](https://apify.com/xquik)) <!-- trust:apify-users 7800 -->
- 5,700,000+ runs of Xquik's Twitter scraper Actors on Apify ([source](https://apify.com/xquik)) <!-- trust:apify-runs 5704701 -->
- 4.66 of 5 for the X Tweet Scraper from 16 Apify reviews ([source](https://apify.com/xquik/x-tweet-scraper/reviews)) <!-- trust:apify-rating 4.66 16 -->
- 3,900+ accounts on xquik.com ([source](https://xquik.com/trust#accounts)) <!-- trust:accounts 3924 -->
- 1,600+ installs of Xquik's Twitter Skills on skills.sh ([source](https://xquik.com/trust#skill-installs)) <!-- trust:skill-installs 1612 -->
- $38,000+ in revenue verified by TrustMRR ([source](https://trustmrr.com/startup/xquik)) <!-- trust:revenue 38115 -->
- 501 ms median REST API read time over the last 7 days ([source](https://xquik.com/trust#speed)) <!-- trust:rest-p50 501 -->
- 370+ GitHub stars across Xquik's repos ([source](https://github.com/Xquik-dev)) <!-- trust:github-stars 374 -->
- 1,000+ downloads of @xquik/paperclip-plugin-xquik on npm ([source](https://www.npmjs.com/package/@xquik/paperclip-plugin-xquik)) <!-- trust:npm-xquik-paperclip-plugin-xquik 1026 -->
- This repo meets the OpenSSF Best Practices passing criteria ([source](https://www.bestpractices.dev/projects/13727)) <!-- trust:openssf-paperclip-plugin-xquik 1 -->

Checked on 2026-10-15. See each number with its date & source on [xquik.com/trust](https://xquik.com/trust) or as [JSON](https://xquik.com/trust.json).

<!-- trust:end -->

## Tools

| Agent task | Paperclip tool | Result |
| --- | --- | --- |
| Search tweets | `xquik.search_tweets` | Run a Twitter search with query operators. |
| Read one tweet | `xquik.lookup_tweet` | Get a tweet by ID. |
| Find X users | `xquik.search_users` | Search by name or username. |
| Read a profile | `xquik.get_user` | Get public profile data. |
| Read profile tweets | `xquik.get_user_tweets` | List recent posts from one user. |
| Read regional trends | `xquik.get_trends` | Get trends by WOEID, country, or location. |

This plugin does not export followers or publish posts. Use the [Xquik API](https://docs.xquik.com/api-reference/overview) for those tasks.

## Tool parameters

- `xquik.search_tweets` takes `limit` from 1 to 10,000.
- `xquik.get_trends` reads a region from `woeid`, `country`, or `location`.
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

## Install

The plugin needs Node.js 24.11 or newer.

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik
```

Pin the current release when you need reproducible installs.

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik --version 0.2.0
```

## Develop locally

```sh
bin/check-local --no-status
```

`bin/check-local` needs Node.js, uv & either corepack or Bun.
It needs no pnpm install. It runs the pnpm version that `package.json` pins.
It runs that pnpm through corepack, or through `bunx` when corepack is missing.
It stops when the pnpm it finds reports another version.

It runs every check a change must pass, in this order.

1. `reuse lint` checks REUSE 3.3 metadata. It runs at a pinned version through `uvx`.
2. `pnpm install --frozen-lockfile` installs the locked dependencies.
3. `pnpm check` runs type checks, tests at 100% coverage & the build.
4. `pnpm check:reproducible` compares 2 clean builds & package archives.
5. `pnpm audit --audit-level=low` audits every dependency.
6. `pnpm pack --dry-run` lists the package contents.

It stops at the first failure & names the check & the next step.
It posts the result to GitHub as the `xquik-local-checks` commit status.
It posts only when the tree is clean & the commit is on GitHub.
Pass `--no-status` to skip the status.

## Release

`bin/release-local` publishes the version in `package.json` from a maintainer machine.
It reads the npm token from the macOS Keychain.
Set `NPM_KEYCHAIN_SERVICE` & `NPM_KEYCHAIN_ACCOUNT` to the service & account of that Keychain item.

It refuses unless all of these hold.

- The working tree is clean.
- `main` is checked out & matches `origin/main`.
- Tag `v<version>` is new locally & on origin.

Then it runs `bin/check-local`, builds & publishes with `npm publish`.
It runs pnpm the same way as `bin/check-local`.
It skips the upload when the version is already on npm.
Last, it pushes the annotated tag & creates the GitHub release.

## More Xquik tools

- [X (Twitter) scraper API & Twitter MCP server](https://github.com/Xquik-dev/x-twitter-scraper) with REST, MCP & Skill setup.
- Twitter API SDKs for [TypeScript](https://github.com/Xquik-dev/x-twitter-scraper-typescript), [Python](https://github.com/Xquik-dev/x-twitter-scraper-python), [Go](https://github.com/Xquik-dev/x-twitter-scraper-go), [Ruby](https://github.com/Xquik-dev/x-twitter-scraper-ruby), [Java](https://github.com/Xquik-dev/x-twitter-scraper-java), [Kotlin](https://github.com/Xquik-dev/x-twitter-scraper-kotlin), [C#](https://github.com/Xquik-dev/x-twitter-scraper-csharp) & [PHP](https://github.com/Xquik-dev/x-twitter-scraper-php).
- [Twitter CLI & X CLI](https://github.com/Xquik-dev/x-twitter-scraper-cli) for terminal workflows.
- [Twitter advanced search operators](https://github.com/Xquik-dev/x-twitter-advanced-search) with tested examples.
- [Xquik X API & Twitter scraper](https://xquik.com) and the [Twitter API documentation](https://docs.xquik.com/api-reference/overview).

## API contract

- [OpenAPI schema](https://xquik.com/openapi.json)
- [API reference](https://docs.xquik.com/api-reference/overview)
- [Organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md)
- [Organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md)
