import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(
  process.cwd(),
  "public",
  "assets",
  "paper-plane.json",
);

try {
  const data = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(data);

  let modifiedCount = 0;

  const flattenProperty = (prop, label) => {
    if (
      prop &&
      prop.a === 1 &&
      prop.k &&
      Array.isArray(prop.k) &&
      prop.k.length > 0
    ) {
      console.log(`  Flattening ${label}`);
      // Take the first keyframe's start value
      const startValue = prop.k[0].s;

      if (startValue !== undefined) {
        prop.a = 0;
        prop.k = startValue;
        modifiedCount++;
      }
    }
  };

  if (json.layers) {
    json.layers.forEach((layer, index) => {
      // Top-level KS (Transform)
      if (layer.ks) {
        flattenProperty(layer.ks.p, `Layer ${index} (${layer.nm}) Position`);
        flattenProperty(
          layer.ks.a,
          `Layer ${index} (${layer.nm}) Anchor Point`,
        );
        // Optionally flatten rotation if needed, but user mentioned "up" movement (Y axis)
        // flattening rotation (r) might kill banking which is nice. I'll stick to position/anchor.
      }

      // Inspect shapes for groups with transforms
      if (layer.shapes) {
        layer.shapes.forEach((shape, sIndex) => {
          if (shape.it) {
            // Group
            // Find Transform inside Group
            const transform = shape.it.find((item) => item.ty === "tr");
            if (transform) {
              flattenProperty(
                transform.p,
                `Layer ${index} Shape Group ${sIndex} Position`,
              );
              flattenProperty(
                transform.a,
                `Layer ${index} Shape Group ${sIndex} Anchor Point`,
              );
            }
          }
        });
      }
    });
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(json));
    console.log(
      `Successfully modified ${modifiedCount} properties in paper-plane.json`,
    );
  } else {
    console.log("No animated position/anchor properties found to flatten.");
  }
} catch (err) {
  console.error("Error processing Lottie JSON:", err);
  process.exit(1);
}
