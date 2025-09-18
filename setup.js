const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Lowballer Rating Discord Bot...\n');

// Create data directory
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
} else {
    console.log('📁 Data directory already exists');
}

// Check if .env exists
if (!fs.existsSync('.env')) {
    if (fs.existsSync('env.example')) {
        fs.copyFileSync('env.example', '.env');
        console.log('✅ Created .env file from template');
        console.log('⚠️  Please edit .env file with your Discord bot token and other settings');
    } else {
        console.log('❌ env.example file not found');
    }
} else {
    console.log('📄 .env file already exists');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    console.log('   Run: npm install');
} else {
    console.log('✅ Dependencies already installed');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env file with your Discord bot token and settings');
console.log('2. Run: npm install');
console.log('3. Run: npm run deploy (to deploy slash commands)');
console.log('4. Run: npm start (to start the bot)');
console.log('\nFor detailed instructions, see README.md');
