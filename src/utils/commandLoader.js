const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) {
        console.log('📁 Commands directory not found, creating...');
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const commandPath = path.join(commandsPath, folder);
        const stat = fs.statSync(commandPath);
        
        if (stat.isDirectory()) {
            const commandFile = path.join(commandPath, 'index.js');
            
            if (fs.existsSync(commandFile)) {
                try {
                    const command = require(commandFile);
                    
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        console.log(`✅ Loaded command: ${command.data.name}`);
                    } else {
                        console.log(`⚠️ Command at ${commandFile} is missing required "data" or "execute" property`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading command ${folder}:`, error);
                }
            }
        }
    }
    
    console.log(`📊 Loaded ${client.commands.size} commands`);
}

module.exports = { loadCommands };
