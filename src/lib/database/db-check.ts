import { supabase } from './supabase-client';

let isDbStructureValid = false;

const dbCheckPromise = (async () => {
  const tableName = 'images';
  const reqFields = ['id', 'filename', 'src', 'sizes', 'created_at', 'alt_text', 'caption'];

  try {
    // Check basic table existence
    const { error: existError } = await supabase
      .from(tableName)
      .select('id')
      .limit(0);

    if (existError) {
      if (existError.code === '42P01') {
        console.error(`FATAL: Table "${tableName}" does not exist. Please create it in Supabase.`);
        console.error("Fields Required columns: " + reqFields.join(", "));
      } else {
        console.error(`FATAL: Error querying table "${tableName}". Check permissions or connection.`, existError);
      }
      throw new Error(`Database table "${tableName}" verification failed.`);
    }

    // Check for essential columns
    const { error: columnError } = await supabase
      .from(tableName)
      .select(reqFields.join(', '))
      .limit(0);

    if (columnError) {
      if (columnError.code === '42703') {
        console.error(`FATAL: Table "${tableName}" exists but has an incorrect structure. Missing or mismatched essential columns.`);
        console.error(`Details: ${columnError.message}`);
        console.error("Ensure columns exist: id, filename, src, sizes (jsonb), created_at, alt_text, caption");
      } else {
        console.error(`FATAL: Error selecting essential columns from "${tableName}".`, columnError);
      }
      throw new Error(`Database table "${tableName}" structure verification failed.`);
    }

    isDbStructureValid = true;
    return true;

  } catch (error) {
    console.error("Database verification process encountered an error:", (error as Error).message);
    isDbStructureValid = false;
    return false;
  }
})();

export { dbCheckPromise, isDbStructureValid };