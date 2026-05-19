import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const d =
  "M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z";
const regex = /([a-zA-Z])|(-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g;
let m;
const cmds = [];
while ((m = regex.exec(d)) !== null) {
  if (m[1]) cmds.push(m[1]);
  else cmds.push(parseFloat(m[2]));
}

const cx = 84,
  cy = 78;
const rad = (deg) => (deg * Math.PI) / 180;

const planes = [
  { r: 29, startDeg: -163.4 },
  { r: 43, startDeg: -12.5 },
  { r: 59, startDeg: -209.7 },
  { r: 70, startDeg: 82.9 },
].map((arc, i) => {
  const dir = i % 2 === 0 ? 1 : -1;
  const s = rad(arc.startDeg);
  const px = cx + arc.r * Math.cos(s);
  const py = cy + arc.r * Math.sin(s);

  // Flip the planes going CCW (dir === -1)
  const tangentAngle = dir === 1 ? s + Math.PI / 2 : s - Math.PI / 2;

  const originalAngle = Math.atan2(61.238 - 414.9, 481.883 - 267.3);
  let planeAngle = tangentAngle - originalAngle;
  if (i === 3 || i === 1) {
    // Actually if dir === -1, sometimes tangency needs flipping depending on SVG wind. We'll flip purple (3).
    if (i === 3) planeAngle += Math.PI;
  }

  const targetLength = 32;
  const planePathLen = 475;
  const scale = targetLength / planePathLen;
  const center_x = 374.5,
    center_y = 238.0;

  const cosA = Math.cos(planeAngle);
  const sinA = Math.sin(planeAngle);

  const tx = (x, y) =>
    px + ((x - center_x) * scale * cosA - (y - center_y) * scale * sinA);
  const ty = (x, y) =>
    py + ((x - center_x) * scale * sinA + (y - center_y) * scale * cosA);

  let curX = 0,
    curY = 0;
  let out = [];

  for (let idx = 0; idx < cmds.length; ) {
    let cmd = cmds[idx];
    if (cmd === "M") {
      curX = cmds[idx + 1];
      curY = cmds[idx + 2];
      out.push(
        "M" + tx(curX, curY).toFixed(2) + "," + ty(curX, curY).toFixed(2),
      );
      idx += 3;
    } else if (cmd === "l") {
      curX += cmds[idx + 1];
      curY += cmds[idx + 2];
      out.push(
        "L" + tx(curX, curY).toFixed(2) + "," + ty(curX, curY).toFixed(2),
      );
      idx += 3;
    } else if (cmd === "c") {
      let c1x = curX + cmds[idx + 1],
        c1y = curY + cmds[idx + 2];
      let c2x = curX + cmds[idx + 3],
        c2y = curY + cmds[idx + 4];
      let x = curX + cmds[idx + 5],
        y = curY + cmds[idx + 6];
      out.push(
        "C" +
          tx(c1x, c1y).toFixed(2) +
          "," +
          ty(c1x, c1y).toFixed(2) +
          "," +
          tx(c2x, c2y).toFixed(2) +
          "," +
          ty(c2x, c2y).toFixed(2) +
          "," +
          tx(x, y).toFixed(2) +
          "," +
          ty(x, y).toFixed(2),
      );
      curX = x;
      curY = y;
      idx += 7;
    } else if (cmd === "v") {
      curY += cmds[idx + 1];
      out.push(
        "L" + tx(curX, curY).toFixed(2) + "," + ty(curX, curY).toFixed(2),
      );
      idx += 2;
    } else if (cmd === "C") {
      let c1x = cmds[idx + 1],
        c1y = cmds[idx + 2];
      let c2x = cmds[idx + 3],
        c2y = cmds[idx + 4];
      curX = cmds[idx + 5];
      curY = cmds[idx + 6];
      out.push(
        "C" +
          tx(c1x, c1y).toFixed(2) +
          "," +
          ty(c1x, c1y).toFixed(2) +
          "," +
          tx(c2x, c2y).toFixed(2) +
          "," +
          ty(c2x, c2y).toFixed(2) +
          "," +
          tx(curX, curY).toFixed(2) +
          "," +
          ty(curX, curY).toFixed(2),
      );
      idx += 7;
    } else if (cmd === "z") {
      out.push("Z");
      idx++;
    } else {
      break;
    }
  }
  return out.join(" ");
});

const outputPath = path.join(__dirname, "plane-out.json");
fs.writeFileSync(outputPath, JSON.stringify(planes, null, 2));
console.log("DONE WRITING TO " + outputPath);
