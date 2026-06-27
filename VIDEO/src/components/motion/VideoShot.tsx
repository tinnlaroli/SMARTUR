import { OffthreadVideo, Sequence, staticFile } from "remotion";

interface Props {
  id: string;
  frameIn: number;
  playbackRate?: number;
  objectPosition?: string;
}

/**
 * VideoShot — drop-in replacement for ScreenShot using a real WebM recording.
 * The Sequence ensures the video starts playing from frame 0 when frameIn is reached.
 */
export function VideoShot({
  id,
  frameIn,
  playbackRate = 1,
  objectPosition = "top left",
}: Props) {
  return (
    <Sequence from={frameIn} layout="none">
      <OffthreadVideo
        src={staticFile(`recordings/${id}.webm`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition,
        }}
        playbackRate={playbackRate}
        muted
      />
    </Sequence>
  );
}
