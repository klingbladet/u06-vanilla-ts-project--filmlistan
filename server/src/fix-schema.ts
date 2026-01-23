import db from './database.js';

console.log('🔄 Updating database schema...');

try {
  // Drop the old table
  db.exec('DROP TABLE IF EXISTS movies');
  console.log('✓ Dropped old movies table');

  // Recreate with new schema including user_id
  const createMoviesTable = `
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      tmdb_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      release_date TEXT,
      vote_average REAL,
      overview TEXT,
      status TEXT NOT NULL CHECK(status IN ('watchlist', 'watched')),
      personal_rating INTEGER CHECK(personal_rating BETWEEN 1 AND 5),
      review TEXT,
      is_favorite INTEGER DEFAULT 0,
      date_added TEXT DEFAULT (datetime('now')),
      date_watched TEXT,
      UNIQUE(tmdb_id, user_id)
    )
  `;

  db.exec(createMoviesTable);
  console.log('✓ Created new movies table with user_id column');
  console.log('✅ Schema update complete.');

} catch (error) {
  console.error('❌ Failed to update schema:', error);
}
