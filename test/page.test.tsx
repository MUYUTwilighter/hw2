import React from 'react';
import {render, screen, waitFor, fireEvent, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as PowerballModule from '@/lib/powerball';
import Home from '@/app/page';

const mockGenerate: jest.MockedFunction<typeof PowerballModule.generate> = jest.fn();
const mockList: jest.MockedFunction<typeof PowerballModule.list> = jest.fn();
const mockRemove: jest.MockedFunction<typeof PowerballModule.remove> = jest.fn();

jest.mock('@/lib/powerball', () => ({
  generate: (...args: Parameters<typeof PowerballModule.generate>) =>
    mockGenerate(...args),
  list: (...args: Parameters<typeof PowerballModule.list>) =>
    mockList(...args),
  remove: (...args: Parameters<typeof PowerballModule.remove>) =>
    mockRemove(...args),
}));

function makeRecord(overrides?: Partial<{
  date_generated: number; lottery_numbers: number[]; power_ball: number; is_deleted: boolean;
}>) {
  const baseTs = Date.now();
  return {
    date_generated: overrides?.date_generated ?? baseTs,
    lottery_numbers: overrides?.lottery_numbers ?? [1, 12, 23, 34, 45],
    power_ball: overrides?.power_ball ?? 6,
    is_deleted: overrides?.is_deleted ?? false,
  };
}

describe('Home page (client) rendering & interactions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('Initial rendering', async () => {
    mockList.mockResolvedValueOnce([]);
    render(<Home/>);

    expect(await screen.findByRole('heading', {name: /Powerball/i})).toBeDefined();
    expect(screen.getByText(/Click Roll to generate/i)).toBeDefined();

    const historySelect = screen.getByLabelText('History');
    fireEvent.mouseDown(historySelect);
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText(/No records found/i)).toBeDefined();
  });

  test('Click Roll', async () => {
    mockList.mockResolvedValueOnce([]);

    const newRec = makeRecord({lottery_numbers: [2, 9, 19, 33, 60], power_ball: 12});
    mockGenerate.mockResolvedValueOnce(newRec);
    mockList.mockResolvedValueOnce([newRec]);

    render(<Home/>);

    const rollBtn = await screen.findByRole('button', {name: /^Roll$/i});
    await userEvent.click(rollBtn);

    await waitFor(() => {
      for (const n of newRec.lottery_numbers) {
        expect(screen.getByText(String(n))).toBeDefined();
      }
      expect(screen.getByText(String(newRec.power_ball))).toBeDefined();
    });

    expect(screen.queryByText(/Click Roll to generate/i)).toBeNull();

    const historySelect = screen.getByLabelText('History');
    fireEvent.mouseDown(historySelect);
    const listbox = await screen.findByRole('listbox');
    expect(
      within(listbox).getByText((content) => content.includes('| PB') && content.includes('—'))
    ).toBeDefined();
  });

  test('Click on history to show details', async () => {
    const r1 = makeRecord({date_generated: 111, lottery_numbers: [1, 2, 3, 4, 5], power_ball: 9});
    const r2 = makeRecord({date_generated: 222, lottery_numbers: [6, 7, 8, 9, 10], power_ball: 1});
    mockList.mockResolvedValueOnce([r1, r2]);

    render(<Home/>);

    const historySelect = await screen.findByLabelText('History');
    fireEvent.mouseDown(historySelect);
    const listbox = await screen.findByRole('listbox');

    const option2 = within(listbox).getAllByRole('option').find(el => el.textContent?.includes('| PB 1'));
    expect(option2).toBeTruthy();
    await userEvent.click(option2!);

    await waitFor(() => {
      expect(screen.getByText(/Powerball:/i).textContent).toContain(String(r2.power_ball));
      expect(screen.getByText(/Lottery Numbers:/i).textContent).toContain(r2.lottery_numbers.join(', '));
    });
  });

  test('Click to remove', async () => {
    const r1 = makeRecord({date_generated: 111, lottery_numbers: [1, 2, 3, 4, 5], power_ball: 9});
    const r2 = makeRecord({date_generated: 222, lottery_numbers: [6, 7, 8, 9, 10], power_ball: 1});
    mockList.mockResolvedValueOnce([r1, r2]);

    mockRemove.mockResolvedValueOnce(undefined);
    mockList.mockResolvedValueOnce([r2]);

    render(<Home/>);

    const historySelect = await screen.findByLabelText('History');
    fireEvent.mouseDown(historySelect);
    const listbox = await screen.findByRole('listbox');

    const r1Item = within(listbox).getAllByRole('option').find(el => el.textContent?.includes('| PB 9'));
    expect(r1Item).toBeTruthy();

    const removeBtn = within(r1Item!).getByRole('button', {name: /Remove/i});
    await userEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(r1.date_generated);
    });

    fireEvent.mouseDown(historySelect);
    const listbox2 = await screen.findByRole('listbox');
    const allOptions = within(listbox2).getAllByRole('option');
    expect(allOptions.some(el => el.textContent?.includes('| PB 9'))).toBe(false); // r1 is gone
    expect(allOptions.some(el => el.textContent?.includes('| PB 1'))).toBe(true);  // r2 remains
  });
});
