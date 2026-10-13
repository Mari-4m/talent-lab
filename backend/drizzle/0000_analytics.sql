CREATE TABLE visitors (id TEXT PRIMARY KEY NOT NULL, first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL, source TEXT NOT NULL, device TEXT NOT NULL, language TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE events (id TEXT PRIMARY KEY NOT NULL, visitor_id TEXT NOT NULL REFERENCES visitors(id), session_id TEXT NOT NULL, type TEXT NOT NULL, route TEXT NOT NULL, lesson_id TEXT, track TEXT, detail TEXT, score INTEGER, total INTEGER, duration INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX events_time ON events(created_at);
--> statement-breakpoint
CREATE INDEX events_visitor_type ON events(visitor_id,type,lesson_id);
--> statement-breakpoint
CREATE TABLE progress (visitor_id TEXT NOT NULL REFERENCES visitors(id), lesson_id TEXT NOT NULL, track TEXT NOT NULL, completed_at INTEGER NOT NULL, source TEXT NOT NULL, PRIMARY KEY(visitor_id,lesson_id));
--> statement-breakpoint
CREATE TABLE ratings (visitor_id TEXT PRIMARY KEY NOT NULL REFERENCES visitors(id), stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5), comment TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL, updated_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE rate_limits (key TEXT PRIMARY KEY NOT NULL, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
