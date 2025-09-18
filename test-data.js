const { database, initializeDatabase } = require('./src/utils/database');

// Test players with their UUIDs
const testPlayers = [
    { username: 'LiamGTI', uuid: '0fc533c4ac494d09a4188138e6f061ac' },
    { username: 'Technoblade', uuid: 'b876ec32e396476ba1158438d83c67d4' },
    { username: 'Dream', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c8c' },
    { username: 'GeorgeNotFound', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c8d' },
    { username: 'Sapnap', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c8e' },
    { username: 'BadBoyHalo', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c8f' },
    { username: 'Antfrost', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c90' },
    { username: 'Punz', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c91' },
    { username: 'FoolishGamers', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c92' },
    { username: 'Ranboo', uuid: '8192d8c0-4a25-4f8e-8b5d-8c8c8c8c8c93' }
];

// Test raters
const testRaters = [
    { discordId: '123456789012345678', username: 'TestRater1' },
    { discordId: '123456789012345679', username: 'TestRater2' },
    { discordId: '123456789012345680', username: 'TestRater3' },
    { discordId: '123456789012345681', username: 'TestRater4' },
    { discordId: '123456789012345682', username: 'TestRater5' }
];

// Sample comments
const sampleComments = [
    'Great lowballer, fair prices!',
    'Decent trader, sometimes lowballs',
    'Average lowballer',
    'Not great, often lowballs too much',
    'Terrible lowballer, avoid!',
    'Good trader, reasonable offers',
    'Sometimes lowballs but usually fair',
    'Very experienced trader',
    'New to trading, learning',
    'Professional trader'
];

async function addTestData() {
    console.log('🚀 Adding test data...');
    
    try {
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized');
        
        // Add test raters
        for (const rater of testRaters) {
            await database.createUser(rater.discordId, null, rater.username);
        }
        console.log('✅ Test raters added');
        
        // Add test players and ratings
        for (const player of testPlayers) {
            // Create lowballer
            await database.createLowballer(player.uuid, player.username);
            console.log(`✅ Added player: ${player.username}`);
            
            // Add random ratings for each player
            const numRatings = Math.floor(Math.random() * 8) + 3; // 3-10 ratings per player
            
            for (let i = 0; i < numRatings; i++) {
                const rater = testRaters[Math.floor(Math.random() * testRaters.length)];
                const rating = Math.floor(Math.random() * 10) + 1; // 1-10
                const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
                
                try {
                    await database.createRating(player.uuid, rater.discordId, rating, comment);
                } catch (error) {
                    // Ignore duplicate rating errors
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.log(`⚠️ Error adding rating for ${player.username}:`, error.message);
                    }
                }
            }
            
            // Update player stats
            await database.updateLowballerStats(player.uuid);
            
            const playerData = await database.getLowballer(player.uuid);
            console.log(`📊 ${player.username}: ${playerData.average_rating.toFixed(1)}/10 (${playerData.total_ratings} ratings)`);
        }
        
        console.log('🎉 Test data added successfully!');
        console.log('\nYou can now test:');
        console.log('- /leaderboard - See rankings');
        console.log('- /search LiamGTI - Search for players');
        console.log('- /profile Technoblade - View profiles');
        console.log('- /rate - Add new ratings');
        
    } catch (error) {
        console.error('❌ Error adding test data:', error);
    }
}

// Run the script
addTestData();
