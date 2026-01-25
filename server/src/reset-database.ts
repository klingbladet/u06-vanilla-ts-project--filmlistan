import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../database.db');

console.log('🗑️  Återställer databasen...');

// Ta bort databasen om filen finns
if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('✓ Tog bort befintlig databas');
}

// Skapa ny databas
const db = new Database(dbPath);

// Slå på foreign keys
db.pragma('foreign_keys = ON');

// Skap tabeller (en databas per projekt, ingen användaruppdelning)
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
    personal_rating INTEGER CHECK(personal_rating BETWEEN 1 AND 10),
    review TEXT,
    is_favorite INTEGER DEFAULT 0,
    date_added TEXT DEFAULT (datetime('now')),
    date_watched TEXT,
    UNIQUE(tmdb_id, user_id)
  )
`;

db.exec(createMoviesTable);

console.log('✓ Skapade nya databastabeller');
console.log('');
console.log('✅ Databasåterställning klar!');
console.log('   Du kan nu starta servern med: npm run dev');

db.close();


