import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  OffthreadVideo,
  staticFile,
} from "remotion";

// ── timing ────────────────────────────────────────────────────
const FPS = 30;
const TYPE_START = 18;
const FRAMES_PER_CHAR = 5;
const HOLD_BUFFER = 25; // frames to show full text after typing finishes

function titleDuration(text: string): number {
  const lines = text.toUpperCase().split("\n");
  const totalChars = lines.reduce((acc, l) => acc + l.length, 0) + Math.max(0, lines.length - 1);
  return TYPE_START + totalChars * FRAMES_PER_CHAR + HOLD_BUFFER;
}

// Outro: type "TAKE CONTROL" → hold + 1 blink → backspace all → type "DATA PHANTOM" → hold + 3 blinks
const OUTRO_TEXT_1 = "TAKE CONTROL";
const OUTRO_TEXT_2 = "DATA PHANTOM";
const OUTRO_DATA_LEN = 5; // "DATA " – PHANTOM is dimmer like extension logo
const OUTRO_PHASE1_END = TYPE_START + OUTRO_TEXT_1.length * FRAMES_PER_CHAR;  // type first line
const OUTRO_HOLD_AFTER_TAKE_CONTROL = 30; // 1 blink (15f on, 15f off)
const OUTRO_HOLD_BLINKS = 3; // cursor blinks at end (15f on, 15f off = 30f per blink)
const OUTRO_HOLD_FRAMES = OUTRO_HOLD_BLINKS * 30; // 90 frames = 3 blinks after "DATA PHANTOM"
const OUTRO_PHASE1_HOLD_END = OUTRO_PHASE1_END + OUTRO_HOLD_AFTER_TAKE_CONTROL; // hold "TAKE CONTROL", cursor blinks 1x
const FRAMES_PER_CHAR_BACKSPACE = Math.floor(FRAMES_PER_CHAR / 2); // backspace 2x faster
const OUTRO_PHASE2_END = OUTRO_PHASE1_HOLD_END + OUTRO_TEXT_1.length * FRAMES_PER_CHAR_BACKSPACE; // backspace
const OUTRO_PHASE3_END = OUTRO_PHASE2_END + OUTRO_TEXT_2.length * FRAMES_PER_CHAR; // type "DATA PHANTOM"
function outroDuration(): number {
  return OUTRO_PHASE3_END + OUTRO_HOLD_FRAMES; // hold "DATA PHANTOM", cursor blinks 3x
}

const CLIP_DUR = {
  "1.mp4": Math.round(6.76 * FPS),             // 203 – Scrape
  "2.mp4": Math.round(1.69 * FPS),             //  51 – Manually
  "4 AI scan.mp4": Math.round(1.79 * FPS),     //  54 – With AI
  "5 AI extraction.mp4": Math.round(3.98 * FPS), // 119 – Your way (legacy)
  "7.mp4": Math.round(5 * FPS),  // extension segment – set to your video length in frames
  "8.mp4": Math.round(3.98 * FPS), // AI extract – Your way
};

type TitleScene = { kind: "title"; text: string; outro?: boolean; dur: number };
type ClipScene  = { kind: "clip";  file: keyof typeof CLIP_DUR; zoom?: boolean; dur: number };
type Scene = TitleScene | ClipScene;

const SCENES: Scene[] = [
  { kind: "title", text: "Scrape",                    dur: titleDuration("Scrape") },
  { kind: "clip",  file: "1.mp4",                     dur: CLIP_DUR["1.mp4"] },

  { kind: "title", text: "Manually",                  dur: titleDuration("Manually") },
  { kind: "clip",  file: "2.mp4",                     dur: CLIP_DUR["2.mp4"] },

  { kind: "title", text: "Extract with AI",           dur: titleDuration("Extract with AI") },
  { kind: "clip",  file: "4 AI scan.mp4",             dur: CLIP_DUR["4 AI scan.mp4"] },

  { kind: "title", text: "Your way",                  dur: titleDuration("Your way") },
  { kind: "clip",  file: "8.mp4",                     dur: CLIP_DUR["8.mp4"] },

  { kind: "title", text: "Use your own\nGemini keys", dur: titleDuration("Use your own\nGemini keys") },
  { kind: "clip",  file: "7.mp4",                     dur: CLIP_DUR["7.mp4"], zoom: true },

  { kind: "title", text: "Take control",              dur: outroDuration(), outro: true },
];

// cumulative starts
let _cursor = 0;
const STARTS = SCENES.map((s) => {
  const t = _cursor;
  _cursor += s.dur;
  return t;
});
export const TOTAL_FRAMES = _cursor;

// Extension text style (from popup.css)
const EXTENSION_STYLE = {
  fontFamily: "'Courier New', Consolas, Monaco, monospace",
  color: "#00ff41",
  textShadow: "0 0 10px rgba(0, 255, 65, 0.35)",
  fontWeight: 400 as const,
  letterSpacing: 4,
};

// ── Title Card ────────────────────────────────────────────────
const TitleCard: React.FC<{ text: string; outro?: boolean }> = ({ text, outro }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const scale   = interpolate(frame, [0, 12], [0.98, 1], { extrapolateRight: "clamp" });

  const glow = outro ? 0.6 + 0.4 * Math.sin(Math.max(0, frame - 18) * 0.12) : 1;
  const baseFontSize = outro ? 150 : text.includes("\n") ? 100 : 130;

  // Cursor: slow, regular blink
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;

  // Outro: type "TAKE CONTROL" → hold + 3 blinks → backspace → type "DATA PHANTOM" → hold + 3 blinks
  if (outro) {
    let displayText = "";
    let showCursor = false;
    if (frame < OUTRO_PHASE1_END) {
      const visible = Math.min(OUTRO_TEXT_1.length, Math.max(0, Math.floor((frame - TYPE_START) / FRAMES_PER_CHAR)));
      displayText = OUTRO_TEXT_1.slice(0, visible);
      showCursor = cursorBlink && visible > 0;
    } else if (frame < OUTRO_PHASE1_HOLD_END) {
      displayText = OUTRO_TEXT_1;
      showCursor = cursorBlink;
    } else if (frame < OUTRO_PHASE2_END) {
      const backspaced = Math.floor((frame - OUTRO_PHASE1_HOLD_END) / FRAMES_PER_CHAR_BACKSPACE);
      const visible = Math.max(0, OUTRO_TEXT_1.length - backspaced);
      displayText = OUTRO_TEXT_1.slice(0, visible);
      showCursor = cursorBlink && visible > 0;
    } else {
      const visible = Math.min(OUTRO_TEXT_2.length, Math.max(0, Math.floor((frame - OUTRO_PHASE2_END) / FRAMES_PER_CHAR)));
      displayText = OUTRO_TEXT_2.slice(0, visible);
      showCursor = cursorBlink && visible > 0;
    }
    return (
      <AbsoluteFill style={{ backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0, 255, 65, 0.08) 0%, transparent 70%)", opacity }} />
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            textAlign: "center",
            ...EXTENSION_STYLE,
            filter: `drop-shadow(0 0 ${20 * glow}px rgba(0, 255, 65, 0.35))`,
          }}
        >
          <div style={{ fontSize: baseFontSize, letterSpacing: 4, lineHeight: 1.4 }}>
            {frame >= OUTRO_PHASE2_END ? (() => {
              const v = Math.min(OUTRO_TEXT_2.length, Math.max(0, Math.floor((frame - OUTRO_PHASE2_END) / FRAMES_PER_CHAR)));
              const dataVisible = Math.min(OUTRO_DATA_LEN, v);
              const phantomVisible = Math.max(0, v - OUTRO_DATA_LEN);
              return (
                <>
                  {OUTRO_TEXT_2.slice(0, dataVisible)}
                  <span style={{ opacity: 0.55 }}>{OUTRO_TEXT_2.slice(OUTRO_DATA_LEN, OUTRO_DATA_LEN + phantomVisible)}</span>
                  <span style={{ visibility: showCursor ? "visible" : "hidden" }}>|</span>
                </>
              );
            })() : (
              <>
                {displayText}
                <span style={{ visibility: showCursor ? "visible" : "hidden" }}>|</span>
              </>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Normal title: typewriter
  const lines = text.toUpperCase().split("\n");
  const totalChars = lines.reduce((acc, l) => acc + l.length, 0) + Math.max(0, lines.length - 1);
  const visibleCount = Math.min(totalChars, Math.max(0, Math.floor((frame - TYPE_START) / FRAMES_PER_CHAR)));
  let charIndex = 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 255, 65, 0.08) 0%, transparent 70%)",
          opacity,
        }}
      />

      {/* Main text – extension style + typewriter */}
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
          ...EXTENSION_STYLE,
          filter: outro ? `drop-shadow(0 0 ${20 * glow}px rgba(0, 255, 65, 0.35))` : "none",
        }}
      >
        {lines.map((line, i) => {
          const lineLen = line.length;
          const start = charIndex;
          charIndex += lineLen + (i < lines.length - 1 ? 1 : 0);
          const lineVisible = Math.min(lineLen, Math.max(0, visibleCount - start));
          const visible = line.slice(0, lineVisible);
          // Cursor: show while typing this line, or held at end of line before next (avoids jump)
          const endOfLine = start + lineLen + (i < lines.length - 1 ? 1 : 0);
          const showCursor = cursorBlink && visibleCount > start && visibleCount <= endOfLine;
          return (
            <div
              key={i}
              style={{
                fontSize: baseFontSize,
                letterSpacing: 4,
                lineHeight: 1.4,
              }}
            >
              {visible}
              <span style={{ visibility: showCursor ? "visible" : "hidden" }}>|</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Crop scales measured from actual video frames.
// Each recording has white OS-desktop space around the browser/UI content.
// Scaling up fills the canvas and hides the white borders.
const CROP: Record<string, { scale: number; ox: string; oy: string }> = {
  "1.mp4":               { scale: 1.58, ox: "50%", oy: "50%" }, // browser ~1220px wide
  "2.mp4":               { scale: 1.90, ox: "50%", oy: "50%" }, // browser ~1015px wide
  "4 AI scan.mp4":       { scale: 1.58, ox: "50%", oy: "50%" }, // same layout as 1
  "5 AI extraction.mp4": { scale: 1.62, ox: "50%", oy: "50%" }, // legacy
  "8.mp4":               { scale: 1.62, ox: "50%", oy: "50%" }, // AI extract
};

// ── Video Clip ────────────────────────────────────────────────
const VideoClip: React.FC<{ file: string; zoom?: boolean }> = ({ file, zoom }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const videoStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };

  // 7.mp4 full screen + password typing overlay
  if (zoom) {
    const typingStart = 15;
    const charsPerFrame = 7;
    const maxDots = 12;
    const typingFrame = Math.max(0, frame - typingStart);
    const numDots = Math.min(maxDots, Math.floor(typingFrame / charsPerFrame));
    const passwordText = "•".repeat(numDots);
    const cursorVisible = Math.floor(frame * 0.15) % 2 === 0;

    return (
      <AbsoluteFill style={{ opacity: fadeIn, overflow: "hidden" }}>
        <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }} />
        <div style={{ position: "absolute", inset: 0 }}>
          <OffthreadVideo src={staticFile(file)} style={videoStyle} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "25%", backgroundColor: "#16161e", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "25%", backgroundColor: "#16161e", pointerEvents: "none" }} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "65%",
            transform: "translate(-80px, -50%)",
            display: "flex",
            alignItems: "center",
            gap: 0,
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 22, letterSpacing: 2, ...EXTENSION_STYLE }}>
            {passwordText}
          </span>
          <span style={{ fontSize: 22, marginLeft: 2, visibility: cursorVisible ? "visible" : "hidden", ...EXTENSION_STYLE }}>|</span>
        </div>
      </AbsoluteFill>
    );
  }

  const crop = CROP[file] ?? { scale: 1, ox: "50%", oy: "50%" };

  return (
    <AbsoluteFill style={{ opacity: fadeIn, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${crop.scale})`,
          transformOrigin: `${crop.ox} ${crop.oy}`,
        }}
      >
        <OffthreadVideo src={staticFile(file)} style={videoStyle} />
      </div>
    </AbsoluteFill>
  );
};

// ── Composition root ──────────────────────────────────────────
export const LandingVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {SCENES.map((scene, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={scene.dur}>
          {scene.kind === "title" ? (
            <TitleCard text={scene.text} outro={scene.outro} />
          ) : (
            <VideoClip file={scene.file} zoom={scene.zoom} />
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
