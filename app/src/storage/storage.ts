import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { emptyStore, type Store } from "../types/schema";
import { migrate } from "./migrations";
import { buildSeedStore } from "../seed";

const FILE_NAME = "mealplan.json";
const TEMP_NAME = "mealplan.json.tmp";
const DIRECTORY = Directory.Data;

/**
 * Loads the store from disk, migrating it to the current schema version if
 * needed. If no file exists yet (first launch), returns the seeded store —
 * v1's Week 1 and 16 recipes migrated into the new schema — rather than an
 * empty one, since an empty library is not a useful first-run state for a
 * personal app with exactly one household.
 */
export async function loadStore(): Promise<Store> {
  let raw: string;
  try {
    const result = await Filesystem.readFile({
      path: FILE_NAME,
      directory: DIRECTORY,
      encoding: Encoding.UTF8,
    });
    raw = typeof result.data === "string" ? result.data : await blobToText(result.data);
  } catch {
    // No file yet: first launch.
    const seeded = buildSeedStore();
    await saveStore(seeded);
    return seeded;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt file: do not silently discard it — fail loudly rather than
    // overwrite data that might still be recoverable by hand.
    throw new Error(`${FILE_NAME} is not valid JSON`);
  }

  const migrated = migrate(parsed);
  return normalizeStore(migrated);
}

/**
 * Writes the store atomically: write to a temp file, then rename over the
 * real one, so a crash or kill mid-write never leaves a half-written
 * mealplan.json.
 */
export async function saveStore(store: Store): Promise<void> {
  const data = JSON.stringify(store, null, 2);

  await Filesystem.writeFile({
    path: TEMP_NAME,
    directory: DIRECTORY,
    data,
    encoding: Encoding.UTF8,
  });

  try {
    await Filesystem.deleteFile({ path: FILE_NAME, directory: DIRECTORY });
  } catch {
    // Fine — this is the first save, there's nothing to replace yet.
  }

  await Filesystem.rename({
    from: TEMP_NAME,
    to: FILE_NAME,
    directory: DIRECTORY,
    toDirectory: DIRECTORY,
  });
}

/** Fills in any fields a migration left undefined, against emptyStore()'s shape. */
function normalizeStore(doc: any): Store {
  const base = emptyStore();
  return {
    schemaVersion: doc.schemaVersion ?? base.schemaVersion,
    ingredients: doc.ingredients ?? base.ingredients,
    families: doc.families ?? base.families,
    recipes: doc.recipes ?? base.recipes,
    weeks: doc.weeks ?? base.weeks,
    log: doc.log ?? base.log,
    settings: { ...base.settings, ...doc.settings },
  };
}

async function blobToText(blob: Blob): Promise<string> {
  return await blob.text();
}
