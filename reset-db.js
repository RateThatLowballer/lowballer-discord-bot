const fs = require('fs');
const path = require('path');

async function resetDatabase() {
    try {
        console.log('🗑️ Resetting database...');
        
        // Delete the database file
        const dbPath = './data/ratings.db';
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('✅ Database file deleted');
        }
        
        // Recreate the data directory
        const dataDir = './data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('✅ Data directory recreated');
        }
        
        console.log('🎉 Database reset complete!');
        console.log('Now run: node test-data-real.js');
        
    } catch (error) {
        console.error('❌ Error resetting database:', error);
    }
}

resetDatabase();
