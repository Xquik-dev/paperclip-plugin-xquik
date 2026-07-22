# Xquik Paperclip Plugin

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13727/badge)](https://www.bestpractices.dev/projects/13727)

Add 6 read-only Xquik tools to Paperclip agents.

## Tools

- `xquik.search_tweets`: Search X with query operators.
- `xquik.lookup_tweet`: Fetch a tweet by ID.
- `xquik.search_users`: Search users by name or username.
- `xquik.get_user`: Fetch a user profile.
- `xquik.get_user_tweets`: List recent tweets posted by a user.
- `xquik.get_trends`: Fetch current trends by WOEID.

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
