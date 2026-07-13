# Xquik Paperclip Plugin

> **Xquik is an independent third-party service.** Not affiliated with X Corp.
> "Twitter" and "X" are trademarks of X Corp.

Paperclip plugin that gives agents Xquik tools for X search, tweet lookup, user lookup, user timelines, and trends.

## Tools

- `xquik.search_tweets` - search X with query operators.
- `xquik.lookup_tweet` - fetch a tweet by ID.
- `xquik.search_users` - search users by name or username.
- `xquik.get_user` - fetch a user profile.
- `xquik.get_user_tweets` - list recent tweets posted by a user.
- `xquik.get_trends` - fetch current trends by WOEID.

## Configuration

Set these instance configuration fields in Paperclip:

- `apiBaseUrl` - defaults to `https://xquik.com/api/v1`.
- `apiKeySecretRef` - Paperclip secret reference containing an Xquik API key.
- `defaultSearchLimit` - default tweet search limit, 1 to 200.
- `defaultTrendCount` - default trend count, 1 to 50.

The plugin resolves the API key through Paperclip secrets at call time and sends it as the `x-api-key` header.

## Install

Install the public npm package through Paperclip:

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik
```

To pin the current release:

```sh
paperclipai plugin install @xquik/paperclip-plugin-xquik --version 0.1.2
```

For local development, install from an absolute checkout path after running `pnpm build`.

## Development

```sh
pnpm install
pnpm check
```

Build output is written to `dist/`. The package declares Paperclip plugin entrypoints through the `paperclipPlugin` field in `package.json`.

## Source Truth

The public Xquik API base is `https://xquik.com/api/v1`. Endpoint names and parameters are sourced from the live Xquik OpenAPI document at `https://xquik.com/openapi.json` and the Xquik source tree.
