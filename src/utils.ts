export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateLeadId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `RRID-${date}-${rand}`;
}

// Returns a list of invalid field names. Empty array = all good.
export function validateSubmission(name: string, phone: string, email: string): string[] {
  const invalid: string[] = [];

  if (!name || !/^[a-zA-Z\s'\-.]{2,80}$/.test(name))
    invalid.push("name");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    invalid.push("email");

  const digits = phone.replace(/[\s()\-+.]/g, "");
  if (!phone || !/^\d{10,15}$/.test(digits) || /^(\d)\1+$/.test(digits))
    invalid.push("phone");

  return invalid;
}
