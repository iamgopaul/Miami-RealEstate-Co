import { google } from "googleapis";

export interface Lead {
  name:      string;
  email:     string;
  phone:     string;
  city:      string;
  zip:       string;
  budget:    string;
  timeline:  string;
  timestamp: string;
  source:    string;
}

// Column headers — row 1 of your Google Sheet must match this order
const HEADERS = ["Timestamp", "Name", "Email", "Phone", "City", "Zip", "Budget", "Timeline", "Source"];

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME     = process.env.GOOGLE_SHEET_NAME ?? "Leads";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function appendLead(lead: Lead): Promise<void> {
  const row = [
    lead.timestamp,
    lead.name,
    lead.email,
    lead.phone,
    lead.city,
    lead.zip,
    lead.budget,
    lead.timeline,
    lead.source,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId:    SPREADSHEET_ID,
    range:            `${SHEET_NAME}!A:${colLetter(HEADERS.length)}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

function colLetter(n: number): string {
  return String.fromCharCode(64 + n);
}
