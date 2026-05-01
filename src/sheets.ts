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

const HEADERS    = ["Timestamp", "Name", "Email", "Phone", "City", "Zip", "Budget", "Timeline", "Source"];
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? "Leads";

const PLACEHOLDER = (v: string) =>
  !v || v.startsWith("your") || v.includes("xxx") || v.includes("...");

function sheetsClient() {
  const sheetId = process.env.GOOGLE_SHEET_ID   ?? "";
  const email   = process.env.GOOGLE_CLIENT_EMAIL ?? "";
  const key     = process.env.GOOGLE_PRIVATE_KEY  ?? "";
  if (PLACEHOLDER(sheetId) || PLACEHOLDER(email) || PLACEHOLDER(key)) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key:  key.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return { api: google.sheets({ version: "v4", auth }), sheetId };
}

export async function appendLead(lead: Lead): Promise<void> {
  const client = sheetsClient();
  if (!client) {
    console.warn("Google Sheets not configured — skipping sheet append");
    return;
  }

  const row = [
    lead.timestamp, lead.name, lead.email, lead.phone,
    lead.city, lead.zip, lead.budget, lead.timeline, lead.source,
  ];

  await client.api.spreadsheets.values.append({
    spreadsheetId:    client.sheetId,
    range:            `${SHEET_NAME}!A:${colLetter(HEADERS.length)}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

function colLetter(n: number): string {
  return String.fromCharCode(64 + n);
}
