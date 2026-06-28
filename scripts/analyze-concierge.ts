#!/usr/bin/env node
/**
 * Compute concierge test metrics from participants + trip-log CSVs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function parseCsv(path: string): Record<string, string>[] {
  const content = readFileSync(path, "utf-8");
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i]?.trim() ?? "";
    });
    return row;
  });
}

function main() {
  const participants = parseCsv(join(ROOT, "concierge/participants.csv"));
  const trips = parseCsv(join(ROOT, "concierge/trip-log.csv"));

  if (trips.length === 0) {
    console.log("No trip data yet. See docs/02-concierge-test-playbook.md");
    return;
  }

  const week1Users = new Set(
    participants.filter((p) => p.week1_active === "Y").map((p) => p.participant_id)
  );
  const week2Users = new Set(
    participants.filter((p) => p.week2_active === "Y").map((p) => p.participant_id)
  );

  if (week1Users.size === 0) {
    const byParticipant = new Map<string, Set<string>>();
    for (const t of trips) {
      if (!t.participant_id || !t.trip_date) continue;
      if (!byParticipant.has(t.participant_id)) {
        byParticipant.set(t.participant_id, new Set());
      }
      byParticipant.get(t.participant_id)!.add(t.trip_date);
    }
    for (const [pid, dates] of byParticipant) {
      if (dates.size >= 1) week1Users.add(pid);
      if (dates.size >= 2) week2Users.add(pid);
    }
  }

  const w2Retention =
    week1Users.size > 0
      ? ((week2Users.size / week1Users.size) * 100).toFixed(1)
      : "N/A";

  const scansByTrip = new Map<string, number>();
  for (const t of trips) {
    const key = `${t.participant_id}-${t.trip_date}`;
    scansByTrip.set(key, (scansByTrip.get(key) ?? 0) + 1);
  }
  const scansPerTrip = [...scansByTrip.values()];
  const medianScans =
    scansPerTrip.length > 0
      ? scansPerTrip.sort((a, b) => a - b)[Math.floor(scansPerTrip.length / 2)]
      : 0;

  const avoidMaybe = trips.filter(
    (t) =>
      t.verdict?.toLowerCase() === "avoid" ||
      t.verdict?.toLowerCase() === "maybe"
  );
  const captured = avoidMaybe.filter((t) => t.reason_chip || t.capture_method !== "none");
  const captureRate =
    avoidMaybe.length > 0
      ? ((captured.length / avoidMaybe.length) * 100).toFixed(1)
      : "N/A";

  const cartChanges = trips.filter((t) => t.cart_changed === "Y");
  const cartChangeRate =
    trips.length > 0
      ? ((cartChanges.length / trips.length) * 100).toFixed(1)
      : "N/A";

  const comparisons = trips.filter((t) => t.comparison_pair_id);
  const w2WithComparison = new Set(
    comparisons.map((t) => t.participant_id)
  );

  console.log("=== CONCIERGE METRICS ===\n");
  console.log(`Total scan events:     ${trips.length}`);
  console.log(`Unique participants:   ${new Set(trips.map((t) => t.participant_id)).size}`);
  console.log(`Week 1 active:         ${week1Users.size}`);
  console.log(`Week 2 retained:       ${week2Users.size}`);
  console.log(`W2 retention:          ${w2Retention}% (target ≥25%)`);
  console.log(`Median scans/trip:     ${medianScans} (target ≥3)`);
  console.log(`Reason capture rate:   ${captureRate}% (target ≥40%)`);
  console.log(`Cart change rate:      ${cartChangeRate}% (target ≥30%)`);
  console.log(`Comparison users:      ${w2WithComparison.size}`);

  const w2Num = parseFloat(w2Retention);
  console.log("\n=== GATES ===");
  console.log(`W2 ≥25%:               ${!Number.isNaN(w2Num) && w2Num >= 25 ? "PASS" : "PENDING/FAIL"}`);
  console.log(`Capture ≥40%:          ${parseFloat(captureRate) >= 40 ? "PASS" : "PENDING/FAIL"}`);
  console.log(
    `\nDecision: ${!Number.isNaN(w2Num) && w2Num >= 25 ? "Proceed toward MVP build" : "Continue concierge / pivot"}`
  );
}

main();
