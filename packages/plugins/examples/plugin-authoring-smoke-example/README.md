# Plugin Authoring Smoke Example

A Softclip plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into Softclip

```bash
pnpm softclip plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@softclipai/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
