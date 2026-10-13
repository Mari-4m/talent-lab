CREATE TABLE learner_accounts (
 user_id TEXT PRIMARY KEY NOT NULL,
 document TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE learner_handoffs (
 code_hash TEXT PRIMARY KEY NOT NULL,
 document TEXT NOT NULL,
 claimed_by TEXT,
 expires_at INTEGER NOT NULL
);
