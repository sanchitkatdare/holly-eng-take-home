export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

export function lowercaseKeys<T extends Record<string, any>>(obj: T): any {
  const newRecord: Record<string, any> = {};
  for (const key in obj) {
    newRecord[key.toLowerCase()] = obj[key];
  }
  return newRecord;
}
