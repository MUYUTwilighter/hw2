import {expect, test} from "vitest";
import {generate, list} from "@/lib/powerball";
import {LotteryRecord} from "@/lib/types";
import * as fs from "node:fs/promises";

function isRecordValid(record: LotteryRecord) {
  // Length
  if (record.lottery_numbers.length !== 5) {
    return false;
  }
  // Uniqueness
  const uniqueNumbers = new Set(record.lottery_numbers);
  if (uniqueNumbers.size !== 5) {
    return false;
  }
  // Range
  for (const number of record.lottery_numbers) {
    if (number < 1 || number > 69) {
      return false;
    }
  }
  // Sorted
  const sortedNumbers = [...record.lottery_numbers].sort((a, b) => a - b);
  for (let i = 0; i < 5; i++) {
    if (record.lottery_numbers[i] !== sortedNumbers[i]) {
      return false;
    }
  }
  // Power ball range
  return !(record.power_ball < 1 || record.power_ball > 26);
}

test("if the generated record is valid", async () => {
  await generate().then(record => {
    expect(isRecordValid(record)).toBe(true);
  });
});

test("if the listed records are valid", async () => {
  list().then(records => {
    records.forEach(record => {
      expect(isRecordValid(record)).toBe(true);
    });
  });
});

test("if the date_generated is a valid timestamp", async () => {
  await generate().then(record => {
    expect(record.date_generated).toBeLessThanOrEqual(Date.now());
    expect(record.date_generated).toBeGreaterThan(Date.now() - 1000 * 60); // within the last minute
  });
});

test("if broken JSON file is handled", async () => {
  const dir = process.env.LOTTERY_DATA || "./data";
  const file = `${dir}/records.json`;
  await fs.mkdir(dir, {recursive: true});
  await fs.writeFile(file, "{ this is not valid JSON }");
  await list().then(records => {
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(0);
  });
});

test("if missing path is handled", async () => {
  const dir = process.env.LOTTERY_DATA || "./data";
  await fs.unlink(dir).catch(() => {
  });
  await fs.rm(dir, {recursive: true, force: true});
  await list().then(records => {
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(0);
  });
});