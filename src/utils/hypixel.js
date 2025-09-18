const axios = require('axios');
const skyhelper = require('skyhelper-networth');

class HypixelAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.hypixel.net';
        this.rateLimitDelay = 100; // 100ms delay between requests
        this.lastRequest = 0;
    }

    async makeRequest(endpoint) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }

        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                params: { key: this.apiKey },
                timeout: 10000
            });

            this.lastRequest = Date.now();

            if (response.data.success === false) {
                throw new Error(response.data.cause || 'Hypixel API request failed');
            }

            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`Hypixel API error: ${error.response.status} - ${error.response.data?.cause || error.message}`);
            } else if (error.request) {
                throw new Error('Failed to connect to Hypixel API');
            } else {
                throw new Error(`Request error: ${error.message}`);
            }
        }
    }

    async getPlayerByUUID(uuid) {
        try {
            const data = await this.makeRequest(`/player?uuid=${uuid}`);
            return data.player;
        } catch (error) {
            throw new Error(`Failed to get player data: ${error.message}`);
        }
    }

    async getPlayerByName(username) {
        try {
            // First, we need to get the UUID from Mojang API
            const mojangResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, {
                timeout: 5000
            });

            if (!mojangResponse.data || !mojangResponse.data.id) {
                throw new Error('Player not found');
            }

            const uuid = mojangResponse.data.id;
            return await this.getPlayerByUUID(uuid);
        } catch (error) {
            if (error.message.includes('Player not found')) {
                throw new Error('Player not found');
            }
            throw new Error(`Failed to get player data: ${error.message}`);
        }
    }

    async getPlayerStats(usernameOrUuid) {
        try {
            let player;
            
            // Check if it's a UUID or username
            if (usernameOrUuid.length === 32 || usernameOrUuid.includes('-')) {
                // It's a UUID
                player = await this.getPlayerByUUID(usernameOrUuid);
            } else {
                // It's a username, convert to UUID first
                player = await this.getPlayerByName(usernameOrUuid);
            }
            
            if (!player) {
                throw new Error('Player not found');
            }

            // Extract relevant Skyblock stats
            const skyblockStats = player.stats?.SkyBlock || {};
            const profiles = skyblockStats.profiles || {};

            // Get the most recent profile
            const profileKeys = Object.keys(profiles);
            if (profileKeys.length === 0) {
                return {
                    uuid: player.uuid,
                    username: player.displayname,
                    hasSkyblock: false,
                    profiles: []
                };
            }

            // Sort profiles by last save time (most recent first)
            const sortedProfiles = profileKeys
                .map(key => ({
                    key,
                    profile: profiles[key],
                    lastSave: profiles[key].last_save || 0
                }))
                .sort((a, b) => b.lastSave - a.lastSave);

            const latestProfile = sortedProfiles[0].profile;

            // Keep UUID in original format for database consistency
            console.log('Player UUID from Hypixel:', player.uuid);

            // Calculate networth for each profile using basic calculation
            const profilesWithNetworth = [];
            
            for (const p of sortedProfiles) {
                // Use basic networth calculation for now
                const networth = this.calculateNetworth(p.profile);
                
                profilesWithNetworth.push({
                    key: p.key,
                    lastSave: p.lastSave,
                    profileName: p.profile.cute_name || 'Unknown',
                    coopMembers: p.profile.members || {},
                    bankBalance: p.profile.banking?.balance || 0,
                    purse: p.profile.coin_purse || 0,
                    networth: networth
                });
            }

            return {
                uuid: player.uuid,
                username: player.displayname,
                hasSkyblock: true,
                profiles: profilesWithNetworth
            };
        } catch (error) {
            throw new Error(`Failed to get player stats: ${error.message}`);
        }
    }

    calculateNetworth(profile) {
        // Calculate basic networth from coins and some basic stats
        const purse = profile.coin_purse || 0;
        const bankBalance = profile.banking?.balance || 0;
        const bankCoins = profile.bankCoins || 0;
        
        // Add some basic item value estimates based on common Skyblock progression
        let itemValue = 0;
        
        // Check for some valuable items in inventory/armor
        const inventory = profile.inv_contents?.data || [];
        const armor = profile.armor_contents?.data || [];
        const enderChest = profile.ender_chest_contents?.data || [];
        
        // Very basic item value estimation
        const allItems = [...inventory, ...armor, ...enderChest];
        
        // Count some basic valuable items
        for (const item of allItems) {
            if (item && item.tag && item.tag.display && item.tag.display.Name) {
                const itemName = item.tag.display.Name.toLowerCase();
                
                // More realistic value estimates for common Skyblock items
                if (itemName.includes('dragon') || itemName.includes('superior')) {
                    itemValue += 5000000; // 5M coins
                } else if (itemName.includes('aspect') || itemName.includes('sword')) {
                    itemValue += 2000000; // 2M coins
                } else if (itemName.includes('bow') || itemName.includes('runaan')) {
                    itemValue += 1000000; // 1M coins
                } else if (itemName.includes('armor') || itemName.includes('chestplate')) {
                    itemValue += 500000; // 500K coins
                } else if (itemName.includes('pickaxe') || itemName.includes('drill')) {
                    itemValue += 300000; // 300K coins
                } else if (itemName.includes('pet')) {
                    itemValue += 100000; // 100K coins
                }
            }
        }
        
        // Add some basic progression-based value
        const skillLevel = profile.skills?.farming?.level || 0;
        const combatLevel = profile.skills?.combat?.level || 0;
        const miningLevel = profile.skills?.mining?.level || 0;
        
        // Add value based on skill levels (basic progression)
        itemValue += (skillLevel + combatLevel + miningLevel) * 10000;
        
        const totalCoins = purse + bankBalance + bankCoins;
        const totalNetworth = totalCoins + itemValue;
        
        return totalNetworth;
    }

    async isPlayerOnline(uuid) {
        try {
            const data = await this.makeRequest(`/status?uuid=${uuid}`);
            return data.session?.online || false;
        } catch (error) {
            return false;
        }
    }

    async getGuildByPlayer(uuid) {
        try {
            const data = await this.makeRequest(`/guild?player=${uuid}`);
            return data.guild;
        } catch (error) {
            return null;
        }
    }

    // Utility function to format UUID
    formatUUID(uuid) {
        if (!uuid) return null;
        
        // Remove dashes if present
        const cleanUUID = uuid.replace(/-/g, '');
        
        // Add dashes in the correct positions
        return `${cleanUUID.slice(0, 8)}-${cleanUUID.slice(8, 12)}-${cleanUUID.slice(12, 16)}-${cleanUUID.slice(16, 20)}-${cleanUUID.slice(20, 32)}`;
    }

    // Utility function to get player head URL
    getPlayerHeadURL(uuid, username = null) {
        console.log('Getting head URL for UUID:', uuid, 'Username:', username);
        
        // Use Minotar API (more reliable than Crafatar)
        if (username) {
            const url = `https://minotar.net/helm/${username}/64.png`;
            console.log('Generated Minotar URL with username:', url);
            return url;
        }
        
        // UUID should already be without dashes from database
        let cleanUUID = uuid.replace(/-/g, '');
        
        // Ensure it's exactly 32 characters
        if (cleanUUID.length !== 32) {
            console.log('Invalid UUID length:', cleanUUID.length, 'for UUID:', uuid);
            return 'https://minotar.net/helm/Steve/64.png';
        }
        
        const url = `https://minotar.net/helm/${cleanUUID}/64.png`;
        console.log('Generated Minotar URL with UUID:', url);
        
        return url;
    }
}

// Create singleton instance
const hypixelAPI = new HypixelAPI('219e9f04-4e56-4cdf-808b-bb4d702318ff');

module.exports = { hypixelAPI, HypixelAPI };
