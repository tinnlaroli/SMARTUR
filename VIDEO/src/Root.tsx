import { Composition, registerRoot } from "remotion";
import { SmartURPromo } from "./SmartURPromo";
import { TOTAL_FRAMES } from "./helpers/timing";

function RemotionRoot() {
  return (
    <Composition
      id="SmartURPromo"
      component={SmartURPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
}

registerRoot(RemotionRoot);
