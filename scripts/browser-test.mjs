#!/usr/bin/env node
/**
 * Browser test for pocker - navigate, click, screenshot
 * Uses chrome-devtools-server at 127.0.0.1:9223
 */
const CDS = "http://127.0.0.1:9223";
const BASE = "http://localhost:3040";

async function post(path, body = {}) {
  const r = await fetch(`${CDS}/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.is_error) throw new Error(JSON.stringify(d.content));
  return d;
}

async function main() {
  const outDir = "./screenshots";
  await import("fs").then((fs) => fs.promises.mkdir(outDir, { recursive: true }));

  console.log("1. Navigate to play page...");
  await post("navigate_page", { type: "url", url: `${BASE}/play` });
  await new Promise((r) => setTimeout(r, 4000));

  console.log("2. Take snapshot...");
  const snap = await post("take_snapshot", {});
  const snapText = snap.content?.[0]?.text || "";
  console.log("Snapshot preview:", snapText.slice(0, 1500));

  console.log("3. Screenshot - step1_play_initial.png");
  const scr1 = await post("take_screenshot", { format: "png" });
  const base64 = scr1.content?.[0]?.data;
  if (base64) {
    await import("fs").then((fs) => fs.promises.writeFile(`${outDir}/step1_play_initial.png`, Buffer.from(base64, "base64")));
    console.log("   Saved.");
  }

  const startUid = snapText.match(/uid=(\d+_\d+)\s+(?:button|link)\s+["']?([^"']*Start[^"']*|开始|Play)["']?/i)?.[1];
  if (startUid) {
    console.log("4. Click Start (uid:", startUid, ")");
    await post("click", { uid: startUid });
    await new Promise((r) => setTimeout(r, 3000));
    const snap2 = await post("take_snapshot", {});
    const base642 = (await post("take_screenshot", { format: "png" })).content?.[0]?.data;
    if (base642) {
      await import("fs").then((fs) => fs.promises.writeFile(`${outDir}/step2_after_start.png`, Buffer.from(base642, "base64")));
      console.log("   Screenshot step2 saved.");
    }
  }

  const foldUid = (await post("take_snapshot", {})).content?.[0]?.text?.match(/uid=(\d+_\d+)\s+(?:button|link)\s+["']?Fold["']?/i)?.[1];
  if (foldUid) {
    console.log("5. Click Fold...");
    await post("click", { uid: foldUid });
    await new Promise((r) => setTimeout(r, 2000));
    const base643 = (await post("take_screenshot", { format: "png" })).content?.[0]?.data;
    if (base643) {
      await import("fs").then((fs) => fs.promises.writeFile(`${outDir}/step3_after_fold.png`, Buffer.from(base643, "base64")));
      console.log("   Screenshot step3 saved.");
    }
  }

  console.log("Done. Screenshots in", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
