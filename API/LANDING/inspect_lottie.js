import fs from "fs";
import path from "path";

// Fix for ES Modules __dirname
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

  console.log("Inspecting layers for active animations:");

  if (json.layers) {
    json.layers.forEach((layer, index) => {
      console.log(`\nLayer ${index}: ${layer.nm}`);

      const inspectProps = (props, label) => {
        if (!props) return;
        ["p", "a", "s", "r", "o"].forEach((prop) => {
          if (props[prop] && props[prop].a === 1) {
            console.log(`  - [${label}] Property '${prop}' is ANIMATED.`);
            if (
              props[prop].k &&
              Array.isArray(props[prop].k) &&
              props[prop].k.length > 0
            ) {
              // Check if values actually change
              const start = props[prop].k[0].s;
              const end = props[prop].k[props[prop].k.length - 1].s;
              console.log(`    Start: ${JSON.stringify(start)}`);
              console.log(`    End:   ${JSON.stringify(end)}`);
            }
          }
        });
      };

      // Top-level KS (Transform)
      if (layer.ks) inspectProps(layer.ks, "Transform");

      // Inspect shapes for groups with transforms
      if (layer.shapes) {
        layer.shapes.forEach((shape, sIndex) => {
          if (shape.it) {
            // Group
            // Find Transform inside Group
            const transform = shape.it.find((item) => item.ty === "tr");
            if (transform) {
              inspectProps(transform, `Shape Group ${sIndex} Transform`);
            }
          }
        });
      }
    });
  }
} catch (err) {
  console.error("Error:", err);
}
