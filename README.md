# Paperclip plugin for Twitter search & X data

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

[Xquik](https://xquik.com) is the world's fastest and cheapest X Twitter scraper service with the most complete X data.
Xquik charges only for delivered, unique, filter-matching results & never pads rows.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

This plugin adds 6 read-only Xquik tools to Paperclip agents.
They cover Twitter search, tweet lookup, profiles, timelines & regional trends.

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
pnpm install
bin/check-local --no-status
```

`bin/check-local` runs every check a change must pass, in this order.

1. `reuse lint` checks REUSE 3.3 metadata when `reuse` is installed.
2. `pnpm --version` confirms that the pinned pnpm runs.
3. `pnpm install --frozen-lockfile` installs the locked dependencies.
4. `pnpm check` runs type checks, tests at 100% coverage & the build.
5. `pnpm check:reproducible` compares 2 clean builds & package archives.
6. `pnpm audit --audit-level=low` audits every dependency.
7. `pnpm pack --dry-run` lists the package contents.

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
It skips the upload when the version is already on npm.
Last, it pushes the annotated tag & creates the GitHub release.

## API contract

- [OpenAPI schema](https://xquik.com/openapi.json)
- [API reference](https://docs.xquik.com/api-reference/overview)
- [Organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md)
- [Organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md)
