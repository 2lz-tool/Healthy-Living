// Each migration takes the document at version N-1 and returns it at
// version N. Index 0 upgrades v0 (pre-schemaVersion / missing file) to v1.
// Add new migrations by pushing to this array — never rewrite an old one,
// since a document could be sitting at any past version on a real device.

export type Migration = (doc: any) => any;

export const migrations: Migration[] = [
  // v0 -> v1: nothing to transform, v1 is the first real shape. Covers a
  // missing or empty document.
  (doc) => ({ ...doc, schemaVersion: 1 }),
];

export function migrate(doc: any): any {
  let current = doc;
  let version = typeof current?.schemaVersion === "number" ? current.schemaVersion : 0;
  while (version < migrations.length) {
    current = migrations[version](current);
    version += 1;
  }
  return current;
}
