const { database, initializeDatabase } = require('./src/utils/database');

async function debugUUIDs() {
    try {
        await initializeDatabase();
        
        console.log('🔍 Debugging UUID issues...');
        
        // Check what's actually in the database
        const lowballers = await database.getTopLowballers(20);
        
        console.log('\n📊 Players in database:');
        for (const lowballer of lowballers) {
            console.log(`${lowballer.username}: UUID=${lowballer.hypixel_uuid}, Ratings=${lowballer.total_ratings}`);
        }
        
        // Test specific lookups
        console.log('\n🔍 Testing specific UUID lookups:');
        
        // Dream's real UUID from Hypixel
        const dreamRealUUID = 'ec70bcaf702f4bb8b48d276fa52a780c';
        const dreamFormatted = 'ec70bcaf-702f-4bb8-b48d-276fa52a780c';
        
        console.log(`Looking for Dream with UUID: ${dreamRealUUID}`);
        const dream1 = await database.getLowballer(dreamRealUUID);
        console.log(`Result: ${dream1 ? `Found (${dream1.total_ratings} ratings)` : 'Not found'}`);
        
        console.log(`Looking for Dream with formatted UUID: ${dreamFormatted}`);
        const dream2 = await database.getLowballer(dreamFormatted);
        console.log(`Result: ${dream2 ? `Found (${dream2.total_ratings} ratings)` : 'Not found'}`);
        
        // LiamGTI's real UUID
        const liamRealUUID = '0fc533c4ac494d09a4188138e6f061ac';
        const liamFormatted = '0fc533c4-ac49-4d09-a418-8138e6f061ac';
        
        console.log(`\nLooking for LiamGTI with UUID: ${liamRealUUID}`);
        const liam1 = await database.getLowballer(liamRealUUID);
        console.log(`Result: ${liam1 ? `Found (${liam1.total_ratings} ratings)` : 'Not found'}`);
        
        console.log(`Looking for LiamGTI with formatted UUID: ${liamFormatted}`);
        const liam2 = await database.getLowballer(liamFormatted);
        console.log(`Result: ${liam2 ? `Found (${liam2.total_ratings} ratings)` : 'Not found'}`);
        
    } catch (error) {
        console.error('❌ Error debugging UUIDs:', error);
    }
}

debugUUIDs();
