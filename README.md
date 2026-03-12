# Data Phantom Video (Remotion)

Create videos programmatically with [Remotion](https://www.remotion.dev/) and React.

## Prompting with Claude

You can use the **Claude extension** (or Cursor) to prompt and generate Remotion video code. Put pre-recorded clips and other assets in **`public/`** so compositions can reference them with `staticFile("your-file.mp4")`. See [Prompting videos with Claude Code](https://www.remotion.dev/docs/ai/claude-code).

## Setup

```bash
npm install
```

## Preview in Remotion Studio

```bash
npm run dev
```

Opens the Remotion Studio so you can scrub the timeline, change props, and preview your composition.

## Render to video

```bash
npx remotion render src/index.ts DataPhantom out/video.mp4
```

Renders the composition `DataPhantom` to `out/video.mp4`.

## Project structure

- **`src/index.ts`** – Entry point (registers the root).
- **`src/Root.tsx`** – Compositions list (each shows up in the Studio sidebar).
- **`src/MyComposition.tsx`** – Your first composition (edit this to build your video).
- **`public/`** – **Assets folder.** Put pre-recorded videos, images, and audio here. Use `staticFile("filename.mp4")` in your code to reference them.

## Docs

- [Remotion – The fundamentals](https://www.remotion.dev/docs/the-fundamentals)
- [Remotion docs](https://www.remotion.dev/docs)
- [Prompting videos with Claude](https://www.remotion.dev/docs/ai/claude-code)
