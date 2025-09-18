const { database, initializeDatabase } = require('./src/utils/database');

async function checkDatabase() {
    try {
        await initializeDatabase();
        
        console.log('🔍 Checking database contents...');
        
        // Get all lowballers
        const lowballers = await database.getTopLowballers(20);
        
        console.log('\n📊 Players in database:');
        for (const lowballer of lowballers) {
            console.log(`${lowballer.username}: ${lowballer.average_rating.toFixed(1)}/10 (${lowballer.total_ratings} ratings) - UUID: ${lowballer.hypixel_uuid}`);
        }
        
        // Test specific players
        console.log('\n🔍 Testing specific players:');
        const testPlayers = ['Dream', 'GeorgeNotFound', 'Sapnap', 'LiamGTI', 'Technoblade'];
        
        for (const username of testPlayers) {
            try {
                const lowballer = await database.getLowballer(username);
                if (lowballer) {
                    console.log(`✅ ${username}: Found in DB with UUID ${lowballer.hypixel_uuid}`);
                } else {
                    console.log(`❌ ${username}: Not found in DB`);
                }
            } catch (error) {
                console.log(`❌ ${username}: Error - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
}

checkDatabase();
