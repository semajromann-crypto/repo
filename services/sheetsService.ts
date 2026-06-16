/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Function to find an existing spreadsheet or create a new one to store our Wiki saves.
export const getOrCreateSpreadsheet = async (accessToken: string, title: string = "Infinite Wiki Saved Topics") => {
  // 1. Search for existing spreadsheet (requires Drive API usually, but we only have Sheets scope. We'll simply create a new one every time or let user provide a single ID.)
  // Actually, creating a new spreadsheet just returns the ID. To search for an existing spreadsheet by name we need Drive API scopes.
  // We only requested `https://www.googleapis.com/auth/sheets`. So we can only create a new sheet, or read/write to an existing one by its exact ID.
  
  // Let's create a new spreadsheet if we don't know the ID (this is for demo purposes).
  // Ideally, we'd store the spreadsheet ID in user's profile or local storage.
  let sheetId = localStorage.getItem('infinite_wiki_sheet_id');
  if (sheetId) {
    return sheetId; // We already have a sheet.
  }

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: "Saved Topics",
            gridProperties: {
              frozenRowCount: 1,
            }
          }
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create spreadsheet');
  }

  const data = await response.json();
  sheetId = data.spreadsheetId;

  // Let's set up the header row!
  await appendToSheet(accessToken, sheetId as string, ["Topic", "Summary Snippet", "Saved Date"]);

  // Store in local storage so we keep appending next time
  if (sheetId) {
    localStorage.setItem('infinite_wiki_sheet_id', sheetId);
  }

  return sheetId;
};

// Function to append a row of data
export const appendToSheet = async (accessToken: string, spreadsheetId: string, values: string[]) => {
  const range = "Saved Topics!A:C"; 
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to append to spreadsheet');
  }

  return await response.json();
};
