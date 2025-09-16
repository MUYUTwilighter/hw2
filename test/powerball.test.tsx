import {generate, list, remove} from "@/lib/powerball";
import {LotteryRecord} from "@/lib/types";
import * as fs from "node:fs/promises";
import {describe, it} from "@jest/globals";

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

describe("Server-side Powerball functions", () => {
  it("should generate a valid record", async () => {
    const record = await generate();
    expect(isRecordValid(record)).toBe(true);
  });

  it('should generate valid timestamp', async () => {
    await generate().then(record => {
      expect(record.date_generated).toBeLessThanOrEqual(Date.now());
      expect(record.date_generated).toBeGreaterThan(Date.now() - 1000 * 60); // within the last minute
    });
  });

  it("should list records", async () => {
    const records = await list();
    records.forEach(record => {
      expect(isRecordValid(record)).toBe(true);
    });
  });

  it("should remove a record", async () => {
    const record = await generate();
    await remove(record.date_generated);
    const records = await list();
    const found = records.find(r => r.date_generated === record.date_generated);
    expect(found).toBeUndefined();
  });

  it("should handle broken JSON file", async () => {
    const dir = process.env.LOTTERY_DATA || "./data";
    const file = `${dir}/records.json`;
    await fs.mkdir(dir, {recursive: true});
    await fs.writeFile(file, "{ this is not valid JSON }");
    const records = await list();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(0);
  });

  it("should handle missing path", async () => {
    const dir = process.env.LOTTERY_DATA || "./data";
    await fs.unlink(dir).catch(() => {
    });
    await fs.rm(dir, {recursive: true, force: true});
    const records = await list();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(0);
  });
});