const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db;

// Initialize database
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(process.env.DATABASE_PATH || './data/ratings.db');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        db = new sqlite3.Database(process.env.DATABASE_PATH || './data/ratings.db', (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                reject(err);
            } else {
                console.log('✅ Connected to SQLite database');
                createTables().then(resolve).catch(reject);
            }
        });
    });
}

// Create database tables
async function createTables() {
    return new Promise((resolve, reject) => {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                discord_id TEXT UNIQUE NOT NULL,
                hypixel_uuid TEXT,
                username TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Lowballers table
            `CREATE TABLE IF NOT EXISTS lowballers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hypixel_uuid TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                total_ratings INTEGER DEFAULT 0,
                average_rating REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Ratings table
            `CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lowballer_uuid TEXT NOT NULL,
                rater_discord_id TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lowballer_uuid) REFERENCES lowballers (hypixel_uuid),
                FOREIGN KEY (rater_discord_id) REFERENCES users (discord_id)
            )`,
            
            // Guild settings table
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                rating_channel_id TEXT,
                admin_role_id TEXT,
                min_rating INTEGER DEFAULT 1,
                max_rating INTEGER DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        let completed = 0;
        tables.forEach((sql, index) => {
            db.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Error creating table ${index + 1}:`, err.message);
                    reject(err);
                } else {
                    completed++;
                    if (completed === tables.length) {
                        console.log('✅ Database tables created successfully');
                        resolve();
                    }
                }
            });
        });
    });
}

// Database helper functions
const database = {
    // User functions
    async createUser(discordId, hypixelUuid = null, username = null) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO users (discord_id, hypixel_uuid, username, updated_at) 
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
            db.run(sql, [discordId, hypixelUuid, username], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    async getUser(discordId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE discord_id = ?';
            db.get(sql, [discordId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Lowballer functions
    async createLowballer(hypixelUuid, username) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO lowballers (hypixel_uuid, username, updated_at) 
                        VALUES (?, ?, CURRENT_TIMESTAMP)`;
            db.run(sql, [hypixelUuid, username], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    async getLowballer(hypixelUuid) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM lowballers WHERE hypixel_uuid = ?';
            db.get(sql, [hypixelUuid], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    async searchLowballers(query, limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM lowballers 
                        WHERE username LIKE ? 
                        ORDER BY total_ratings DESC, average_rating DESC 
                        LIMIT ?`;
            db.all(sql, [`%${query}%`, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Rating functions
    async createRating(lowballerUuid, raterDiscordId, rating, comment = null) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO ratings (lowballer_uuid, rater_discord_id, rating, comment) 
                        VALUES (?, ?, ?, ?)`;
            db.run(sql, [lowballerUuid, raterDiscordId, rating, comment], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    async getRatings(lowballerUuid, limit = 10, offset = 0) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT r.*, u.username as rater_username 
                        FROM ratings r 
                        LEFT JOIN users u ON r.rater_discord_id = u.discord_id 
                        WHERE r.lowballer_uuid = ? 
                        ORDER BY r.created_at DESC 
                        LIMIT ? OFFSET ?`;
            db.all(sql, [lowballerUuid, limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    async updateLowballerStats(hypixelUuid) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE lowballers 
                        SET total_ratings = (
                            SELECT COUNT(*) FROM ratings WHERE lowballer_uuid = ?
                        ),
                        average_rating = (
                            SELECT AVG(rating) FROM ratings WHERE lowballer_uuid = ?
                        ),
                        updated_at = CURRENT_TIMESTAMP
                        WHERE hypixel_uuid = ?`;
            db.run(sql, [hypixelUuid, hypixelUuid, hypixelUuid], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    async hasUserRated(lowballerUuid, raterDiscordId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM ratings WHERE lowballer_uuid = ? AND rater_discord_id = ?';
            db.get(sql, [lowballerUuid, raterDiscordId], (err, row) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            });
        });
    },

    // Guild settings functions
    async getGuildSettings(guildId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM guild_settings WHERE guild_id = ?';
            db.get(sql, [guildId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    async updateGuildSettings(guildId, settings) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO guild_settings 
                        (guild_id, rating_channel_id, admin_role_id, min_rating, max_rating, updated_at) 
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
            db.run(sql, [
                guildId,
                settings.ratingChannelId || null,
                settings.adminRoleId || null,
                settings.minRating || 1,
                settings.maxRating || 10
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Statistics functions
    async getTopLowballers(limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM lowballers 
                        WHERE total_ratings > 0 
                        ORDER BY average_rating DESC, total_ratings DESC 
                        LIMIT ?`;
            db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    async getWorstLowballers(limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM lowballers 
                        WHERE total_ratings > 0 
                        ORDER BY average_rating ASC, total_ratings DESC 
                        LIMIT ?`;
            db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = { database, initializeDatabase };
