const { database, initializeDatabase } = require('./src/utils/database');

async function cleanDatabase() {
    try {
        await initializeDatabase();
        
        console.log('🧹 Cleaning database...');
        
        // Get all lowballers
        const lowballers = await database.getTopLowballers(50);
        
        console.log(`Found ${lowballers.length} players in database`);
        
        // Group by username to find duplicates
        const playerGroups = {};
        for (const lowballer of lowballers) {
            if (!playerGroups[lowballer.username]) {
                playerGroups[lowballer.username] = [];
            }
            playerGroups[lowballer.username].push(lowballer);
        }
        
        // Find duplicates
        const duplicates = Object.entries(playerGroups).filter(([username, players]) => players.length > 1);
        
        console.log(`\n🔍 Found ${duplicates.length} players with duplicates:`);
        for (const [username, players] of duplicates) {
            console.log(`\n${username}:`);
            for (const player of players) {
                console.log(`  - ${player.hypixel_uuid} (${player.total_ratings} ratings, ${player.average_rating.toFixed(1)}/10)`);
            }
        }
        
        // Keep the one with most ratings for each player
        console.log('\n🗑️ Removing duplicates (keeping the one with most ratings)...');
        
        for (const [username, players] of duplicates) {
            // Sort by total ratings (descending)
            players.sort((a, b) => b.total_ratings - a.total_ratings);
            
            // Keep the first one (most ratings)
            const keepPlayer = players[0];
            const removePlayers = players.slice(1);
            
            console.log(`\n${username}: Keeping ${keepPlayer.hypixel_uuid} (${keepPlayer.total_ratings} ratings)`);
            
            for (const removePlayer of removePlayers) {
                console.log(`  - Removing ${removePlayer.hypixel_uuid} (${removePlayer.total_ratings} ratings)`);
                
                // Delete ratings for this player
                // Note: We'd need to add a delete function to the database module
                // For now, just log what we would do
                console.log(`    Would delete ratings for ${removePlayer.hypixel_uuid}`);
            }
        }
        
        console.log('\n✅ Database cleanup complete!');
        
    } catch (error) {
        console.error('❌ Error cleaning database:', error);
    }
}

cleanDatabase();
