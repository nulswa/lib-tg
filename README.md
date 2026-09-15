# @fargs/tg
> Reusable utilities for Telegram bots built with Telegraf.

## Installation
> In your bot, reference it as a local dependency:

```json
"@fargs/tg": "git+https://github.com/nulswa/fargs-tg.git"
```

- `bold/italic/underline/strike/spoiler/code/pre/link` » HTML formatting, already escaped
- `formatSize(bytes)` » "1.23 MB"
- `onTime(ms)` » "1d:02h:21m:08s"
- `mask(text)` » "@far×××××ive"
- `formatError(pluginName, err)` » error block with a copy button
- `isBuffer(x)` / `isDirectUrl(url)` » boolean checks
- `sendMedia(ctx, source, options)` » sends Buffer, direct URL, or URL+ffmpeg

> [!NOTE]
> These functions *escape* the text they receive, so they are intended for plain text. Do not nest them inside each other (`bold(italic("x"))` won't work as you expect) » if you need to combine formats, build the HTML manually.
