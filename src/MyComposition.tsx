import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 20, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(frame, [0, 15], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontFamily: "system-ui, sans-serif",
          fontSize: 72,
          fontWeight: 700,
          color: "#e0e0ff",
          textAlign: "center",
        }}
      >
        Data Phantom
      </div>
      <div
        style={{
          opacity: opacity * 0.8,
          marginTop: 24,
          fontFamily: "system-ui, sans-serif",
          fontSize: 24,
          color: "#8888aa",
        }}
      >
        Remotion • {fps} fps • {durationInFrames} frames
      </div>
    </AbsoluteFill>
  );
};
