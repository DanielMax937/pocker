#!/usr/bin/env node
/**
 * Play one poker hand via chrome-devtools-server.
 * Screenshot before each human action and save to e2e-screenshots/.
 * Base: http://127.0.0.1:9223
 */
const BASE = process.env.CDS_BASE_URL || 'http://127.0.0.1:9223';
const SCREENSHOT_DIR = `${process.cwd()}/e2e-screenshots`;

const fs = require('fs');
const path = require('path');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function api(endpoint, body = {}) {
  const res = await fetch(`${BASE}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.is_error) {
    throw new Error(JSON.stringify(data.content));
  }
  return data.content;
}

async function get(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`);
  return res.json();
}

async function screenshot(stepName) {
  const file = path.join(SCREENSHOT_DIR, `${stepName}.png`);
  await api('take_screenshot', { format: 'png', filePath: file });
  console.log(`  [screenshot] ${file}`);
  return file;
}

async function snapshot() {
  const content = await api('take_snapshot', {});
  const text = content?.find((c) => c.type === 'text')?.text || '';
  return text;
}

async function click(uid) {
  await api('click', { uid });
}

async function findUidInSnapshot(snap, patterns) {
  const lines = snap.split('\n');
  for (const line of lines) {
    const match = line.match(/uid=([^\s"']+)/);
    if (match) {
      const uid = match[1];
      const rest = line.toLowerCase();
      for (const p of patterns) {
        if (rest.includes(p.toLowerCase())) return uid;
      }
    }
  }
  return null;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('=== Pocker E2E via chrome-devtools-server ===\n');

  let step = 0;

  // 1. Open /play
  console.log('1. Opening http://127.0.0.1:3040/play ...');
  await api('new_page', { url: 'http://127.0.0.1:3040/play', timeout: 30000 });
  await sleep(2000);

  await screenshot(`step-${String(step++).padStart(2, '0')}-initial`);
  let snap = await snapshot();
  console.log('   Snapshot length:', snap.length);

  // 2. Click "Start New Game"
  const startUid = findUidInSnapshot(snap, ['start new game', 'start game']);
  if (!startUid) {
    console.error('   Could not find "Start New Game" button. Snapshot excerpt:');
    console.error(snap.slice(0, 1500));
    process.exit(1);
  }
  console.log('2. Clicking Start New Game (uid:', startUid, ')');
  await click(startUid);
  await sleep(3000); // wait for game init + first AI actions

  await screenshot(`step-${String(step++).padStart(2, '0')}-after-start`);

  // 3. Loop: human turn -> screenshot -> analyze -> click action
  const MAX_HUMAN_TURNS = 20;
  for (let turn = 0; turn < MAX_HUMAN_TURNS; turn++) {
    snap = await snapshot();

    // Check if hand ended (Play Again, Back to Games, etc.)
    if (snap.toLowerCase().includes('play again') || snap.toLowerCase().includes('back to games')) {
      console.log(`\nHand ended at turn ${turn}.`);
      await screenshot(`step-${String(step++).padStart(2, '0')}-hand-ended`);
      break;
    }

    // Check if it's human turn (action buttons visible)
    const foldUid = findUidInSnapshot(snap, ['fold']);
    const checkUid = findUidInSnapshot(snap, ['check']);
    const callUid = findUidInSnapshot(snap, ['call']);
    const betUid = findUidInSnapshot(snap, ['bet']);
    const raiseUid = findUidInSnapshot(snap, ['raise']);
    const allInUid = findUidInSnapshot(snap, ['all-in', 'all in']);

    if (!foldUid && !checkUid && !callUid && !betUid && !raiseUid && !allInUid) {
      console.log(`   Turn ${turn}: Waiting for other players...`);
      await sleep(1500);
      continue;
    }

    console.log(`\n--- Human turn ${turn + 1} ---`);
    await screenshot(`step-${String(step++).padStart(2, '0')}-turn-${turn + 1}-before-action`);

    // Simple strategy: prefer Check, else Call, else Fold
    let actionUid = null;
    let actionName = '';
    if (checkUid) {
      actionUid = checkUid;
      actionName = 'Check';
    } else if (callUid) {
      actionUid = callUid;
      actionName = 'Call';
    } else if (foldUid) {
      actionUid = foldUid;
      actionName = 'Fold';
    } else if (betUid) {
      actionUid = betUid;
      actionName = 'Bet';
    } else if (raiseUid) {
      actionUid = raiseUid;
      actionName = 'Raise';
    } else if (allInUid) {
      actionUid = allInUid;
      actionName = 'All-In';
    }

    if (!actionUid) {
      console.error('   No actionable button found');
      await sleep(1000);
      continue;
    }

    console.log(`   Action: ${actionName} (uid: ${actionUid})`);
    await click(actionUid);
    await sleep(2500); // AI delay + state update
  }

  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
