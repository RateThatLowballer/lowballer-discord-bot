const { database, initializeDatabase } = require('./src/utils/database');

async function resetDatabase() {
    try {
        console.log('🗑️ Resetting database to clean slate...');
        
        // Initialize database connection
        await initializeDatabase();
        console.log('✅ Database connected');
        
        // Clear all tables
        console.log('🧹 Clearing all data...');
        
        // Delete all ratings first (due to foreign key constraints)
        await new Promise((resolve, reject) => {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(process.env.DATABASE_PATH || './data/ratings.db');
            db.run('DELETE FROM ratings', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Cleared ratings table');
        
        // Delete all lowballers
        await new Promise((resolve, reject) => {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(process.env.DATABASE_PATH || './data/ratings.db');
            db.run('DELETE FROM lowballers', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Cleared lowballers table');
        
        // Delete all users
        await new Promise((resolve, reject) => {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(process.env.DATABASE_PATH || './data/ratings.db');
            db.run('DELETE FROM users', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Cleared users table');
        
        // Reset auto-increment counters
        await new Promise((resolve, reject) => {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(process.env.DATABASE_PATH || './data/ratings.db');
            db.run('DELETE FROM sqlite_sequence', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Reset auto-increment counters');
        
        console.log('🎉 Database reset complete!');
        console.log('📊 Database is now a clean slate with no data');
        console.log('🚀 Ready for production use!');
        
    } catch (error) {
        console.error('❌ Error resetting database:', error);
    }
}

// Run the reset
resetDatabase();
