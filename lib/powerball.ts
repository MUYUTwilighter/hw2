"use server";

import {LotteryRecord} from "@/lib/types";
import * as fs from "node:fs/promises";

async function handleFile<T>(handler: (records: LotteryRecord[], file: string) => T): Promise<T> {
  const dir = process.env.LOTTERY_DATA || "data";
  const file = `${dir}/records.json`;
  await fs.mkdir(dir, {recursive: true});
  await fs.access(file).catch(async () => {
    await fs.writeFile(file, "[]");
  });
  return fs.readFile(file).then(data => {
    return JSON.parse(data.toString());
  }).catch(e => {
    console.error(`Broken JSON file "${file}", rebuilding...`);
    console.error(e);
    return [];
  }).then(records => handler(records, file));
}

async function append(record: LotteryRecord) {
  await handleFile((records, file) => {
    records.push(record);
    fs.writeFile(file, JSON.stringify(records, null, 2)).catch(e => {
      console.error(`Error writing to file ${file}: ${e}`);
    });
  })
}

export async function generate(): Promise<LotteryRecord> {
  const lottery_numbers: number[] = [];
  while (lottery_numbers.length < 5) {
    const number = Math.floor(Math.random() * 69) + 1;
    if (!lottery_numbers.includes(number)) {
      lottery_numbers.push(number);
    }
  }
  lottery_numbers.sort((a, b) => a - b);
  const power_ball = Math.floor(Math.random() * 26) + 1;
  const record: LotteryRecord = {
    date_generated: Date.now(),
    is_deleted: false,
    lottery_numbers,
    power_ball,
  };
  await append(record);
  return record;
}

export async function list(): Promise<LotteryRecord[]> {
  return await handleFile(records => records.filter(record => !record.is_deleted));
}

export async function remove(date_generated: number): Promise<void> {
  await handleFile((records, file) => {
    const index = records.findIndex(record => record.date_generated === date_generated);
    if (index !== -1) {
      records[index].is_deleted = true;
      fs.writeFile(file, JSON.stringify(records, null, 2)).catch(e => {
        console.error(`Error writing to file ${file}: ${e}`);
      });
    }
  });
}

