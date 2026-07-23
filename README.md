# Xquik Paperclip Plugin: Tweet Search & X Data Tools

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

Add 6 read-only Xquik tools to Paperclip agents.

## Choose a Tool

| Customer question | Paperclip tool | Purpose |
| --- | --- | --- |
| How can an agent search tweets? | `xquik.search_tweets` | Search with query operators. |
| How can an agent retrieve one tweet? | `xquik.lookup_tweet` | Fetch a tweet by ID. |
| How can an agent search X users? | `xquik.search_users` | Search by name or username. |
| How can an agent fetch a user profile? | `xquik.get_user` | Fetch public profile data. |
| How can an agent read profile tweets? | `xquik.get_user_tweets` | List recent user posts. |
| How can an agent read regional trends? | `xquik.get_trends` | Fetch trends by WOEID. |

Follower exports and posting stay outside this read-only plugin.
Use the [Xquik API](https://docs.xquik.com/api-reference/overview) for those tasks.

## Configuration

Set these instance configuration fields in Paperclip:

- `apiBaseUrl`: Defaults to `https://xquik.com/api/v1`.
- `apiKeySecretRef`: Holds the Paperclip secret reference for your API key.
- `defaultSearchLimit`: Sets the tweet search limit from 1 to 200.
- `defaultTrendCount`: Sets the trend count from 1 to 50.

The plugin resolves the API key through Paperclip secrets at call time and sends it as the `x-api-key` header.

## Install

Install the public npm package through Paperclip:

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik
```

To pin the current release:

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik --version 0.1.5
```

For local development, build first. Then install from the absolute checkout path.

## Development

```sh
pnpm install
pnpm check
```

The build writes package files to `dist/`.

## API Contract

- [OpenAPI schema](https://xquik.com/openapi.json)
- [API reference](https://docs.xquik.com/api-reference/overview)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
