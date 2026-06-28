#!/usr/bin/env node
/**
 * Analyze capture method A/B test from concierge/trip-log.csv
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logPath = join(__dirname, "../concierge/trip-log.csv");

interface TripEvent {
  participant_id: string;
  verdict: string;
  reason_chip: string;
  capture_method: string;
  ab_group: string;
  trip_date: string;
}

function parseCsv(content: string): TripEvent[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",");
  const rows: TripEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 2 || !cols[0]) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = cols[idx]?.trim() ?? "";
    });
    rows.push(row as unknown as TripEvent);
  }

  return rows;
}

function main() {
  let content: string;
  try {
    content = readFileSync(logPath, "utf-8");
  } catch {
    console.log("No trip log data yet. Log events to concierge/trip-log.csv during test.");
    console.log("\nExpected columns include: ab_group, verdict, reason_chip, capture_method");
    process.exit(0);
  }

  const events = parseCsv(content);
  if (events.length === 0) {
    console.log("Trip log is empty. Start logging concierge sessions.");
    process.exit(0);
  }

  const avoidMaybe = events.filter(
    (e) =>
      e.verdict?.toLowerCase() === "avoid" ||
      e.verdict?.toLowerCase() === "maybe"
  );

  const groups = ["A", "B", "C"];

  console.log("=== CAPTURE METHOD A/B ANALYSIS ===\n");

  for (const group of groups) {
    const groupEvents = events.filter((e) => e.ab_group === group);
    const groupAvoidMaybe = avoidMaybe.filter((e) => e.ab_group === group);
    const captured = groupAvoidMaybe.filter(
      (e) => e.reason_chip || (e.capture_method && e.capture_method !== "none")
    );
    const voiceUsed = groupEvents.filter((e) => e.capture_method === "voice");

    const captureRate =
      groupAvoidMaybe.length > 0
        ? ((captured.length / groupAvoidMaybe.length) * 100).toFixed(1)
        : "N/A";

    const participants = new Set(groupEvents.map((e) => e.participant_id));
    const trips = new Set(groupEvents.map((e) => `${e.participant_id}-${e.trip_date}`));

    console.log(`Group ${group}:`);
    console.log(`  Events: ${groupEvents.length}`);
    console.log(`  Participants: ${participants.size}`);
    console.log(`  Trips: ${trips.size}`);
    console.log(`  Avoid/Maybe: ${groupAvoidMaybe.length}`);
    console.log(`  Capture rate: ${captureRate}%`);
    if (group === "B") {
      console.log(`  Voice uses: ${voiceUsed.length}`);
    }
    console.log("");
  }

  console.log("=== MVP RECOMMENDATION ===\n");

  const rateA = calcCaptureRate(events, "A");
  const rateB = calcCaptureRate(events, "B");
  const rateC = calcCaptureRate(events, "C");
  const voiceShare =
    events.filter((e) => e.ab_group === "B" && e.capture_method === "voice")
      .length /
    Math.max(1, events.filter((e) => e.ab_group === "B").length);

  if (rateA === null && rateB === null) {
    console.log("Insufficient data. Default MVP: one-tap chips only (per plan).");
  } else if (rateB !== null && rateA !== null && rateB - rateA >= 15 && voiceShare >= 0.1) {
    console.log("Ship one-tap + optional voice post-decision.");
  } else if (rateA !== null && rateC !== null && rateA >= rateC) {
    console.log("Ship one-tap chips only. Defer voice to Phase 2.");
  } else {
    console.log("Ship one-tap chips only (default). Re-evaluate after more data.");
  }
}

function calcCaptureRate(events: TripEvent[], group: string): number | null {
  const avoidMaybe = events.filter(
    (e) =>
      e.ab_group === group &&
      (e.verdict?.toLowerCase() === "avoid" ||
        e.verdict?.toLowerCase() === "maybe")
  );
  if (avoidMaybe.length === 0) return null;
  const captured = avoidMaybe.filter(
    (e) => e.reason_chip || (e.capture_method && e.capture_method !== "none")
  );
  return (captured.length / avoidMaybe.length) * 100;
}

main();
