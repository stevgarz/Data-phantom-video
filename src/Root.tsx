import React from "react";
import { Composition } from "remotion";
import { LandingVideo, TOTAL_FRAMES } from "./LandingVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LandingVideo"
        component={LandingVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
