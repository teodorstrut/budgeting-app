import { authorizedFetch, parseErrorMessage } from '../googleSheetsUtils';

interface SheetValuesResponse {
  values?: string[][];
}

/**
 * Reads a range of raw sheet values, e.g. 'A2:I' or 'A2:A'. Returns an empty
 * array if the range has no data rows.
 */
export const readSheetRange = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  range: string,
): Promise<string[][]> => {
  const response = await authorizedFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
      `${sheetName}!${range}`,
    )}`,
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to read sheet data.'));
  }
  const data = (await response.json()) as SheetValuesResponse;
  return data.values ?? [];
};

/**
 * Builds a key → 1-based sheet row number index from a contiguous block of
 * rows. `firstRowNumber` is the sheet row number that `rows[0]` corresponds
 * to (e.g. 2 if the range started right after a header row).
 */
export const buildRowIndex = (
  rows: string[][],
  keyExtractor: (row: string[]) => string,
  firstRowNumber: number,
): Map<string, number> => {
  const keyToRow = new Map<string, number>();
  rows.forEach((row, index) => {
    const key = keyExtractor(row).trim();
    if (key) keyToRow.set(key, firstRowNumber + index);
  });
  return keyToRow;
};

/** Overwrites specific rows in place via a single `values:batchUpdate` call. */
export const batchUpdateRows = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  columnRange: string,
  updates: Array<{ rowNum: number; values: (string | number)[] }>,
): Promise<void> => {
  if (updates.length === 0) return;

  const [startCol, endCol] = columnRange.split(':');
  const data = updates.map(({ rowNum, values }) => ({
    range: `${sheetName}!${startCol}${rowNum}:${endCol}${rowNum}`,
    values: [values],
  }));

  const response = await authorizedFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to update rows in Google Sheet.'));
  }
};

/** Appends new rows to the end of a sheet's data via `values:append`. */
export const appendRows = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  columnRange: string,
  values: (string | number)[][],
): Promise<void> => {
  if (values.length === 0) return;

  const response = await authorizedFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
      `${sheetName}!${columnRange}`,
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values }),
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to append rows to Google Sheet.'));
  }
};
