# Assets folder

Put your **pre-recorded videos**, images, and audio here. Remotion will serve them so you can use them in your compositions.

## What to put here

- **Videos** – `.mp4`, `.webm`, `.mov` (clips, B-roll, screen recordings)
- **Images** – `.png`, `.jpg`, `.webp` (logos, thumbnails, overlays)
- **Audio** – `.mp3`, `.wav` (music, voiceover, SFX)

## How to use in your composition

Reference any file in this folder with `staticFile()`:

```tsx
import { OffthreadVideo, staticFile } from "remotion";

// Pre-recorded video
<OffthreadVideo src={staticFile("my-clip.mp4")} />

// Image
<img src={staticFile("logo.png")} alt="Logo" />
```

Paths are relative to this `public/` folder. For example:

- `public/intro.mp4` → `staticFile("intro.mp4")`
- `public/clips/segment-1.mp4` → `staticFile("clips/segment-1.mp4")`

Use **OffthreadVideo** (not `Video`) for best rendering performance and codec support.
