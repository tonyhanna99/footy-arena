#!/usr/bin/env node

/**
 * Fetch missing player images from Wikipedia and update players.js
 * This script finds all players with null images, fetches their Wikipedia images,
 * and updates the players.js file automatically.
 */

const fs = require('fs');
const path = require('path');

// Import the players data
const playersPath = path.join(__dirname, '../src/shared/data/players.js');

async function getWikipediaImage(playerName) {
  try {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 1: Search for the page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName + ' footballer')}&format=json&origin=*`;
    
    console.log(`🔍 Searching for: ${playerName}...`);
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query.search.length) {
      console.log(`❌ No Wikipedia page found`);
      return null;
    }
    
    const pageTitle = searchData.query.search[0].title;
    console.log(`   Found page: ${pageTitle}`);
    
    // Step 2: Get the page content with images
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=500&format=json&origin=*`;
    
    const pageResponse = await fetch(pageUrl);
    const pageData = await pageResponse.json();
    
    const pages = pageData.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    // Check if there's a thumbnail (main infobox image)
    if (page.thumbnail) {
      console.log(`✅ Found image!`);
      return page.thumbnail.source;
    }
    
    console.log(`❌ No suitable image found`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function updatePlayersFile() {
  console.log('📖 Reading players.js file...\n');
  
  // Read the file
  const fileContent = fs.readFileSync(playersPath, 'utf8');
  
  // Extract the FOOTBALL_PLAYERS array
  const match = fileContent.match(/export const FOOTBALL_PLAYERS = (\[[\s\S]*?\]);/);
  
  if (!match) {
    console.error('❌ Could not find FOOTBALL_PLAYERS array');
    process.exit(1);
  }
  
  // Parse the players array
  const playersArray = eval(`(${match[1]})`);
  
  console.log(`📊 Total players: ${playersArray.length}`);
  
  // Find players with null images
  const playersWithoutImages = playersArray.filter(p => !p.image);
  
  console.log(`🔍 Players without images: ${playersWithoutImages.length}\n`);
  console.log('='.repeat(60));
  
  if (playersWithoutImages.length === 0) {
    console.log('✅ All players already have images!');
    return;
  }
  
  // Fetch images for each player
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < playersWithoutImages.length; i++) {
    const player = playersWithoutImages[i];
    console.log(`\n[${i + 1}/${playersWithoutImages.length}] ${player.name}`);
    
    const imageUrl = await getWikipediaImage(player.name);
    
    if (imageUrl) {
      successCount++;
      results.push({ name: player.name, image: imageUrl, success: true });
      
      // Update the player in the array
      const playerIndex = playersArray.findIndex(p => p.name === player.name);
      if (playerIndex !== -1) {
        playersArray[playerIndex].image = imageUrl;
      }
    } else {
      failCount++;
      results.push({ name: player.name, image: null, success: false });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Successfully fetched: ${successCount}`);
  console.log(`❌ Failed to fetch: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\n💾 Updating players.js file...');
    
    // Convert the updated array back to string format
    let updatedContent = 'export const FOOTBALL_PLAYERS = [\n';
    
    playersArray.forEach((player, index) => {
      updatedContent += '  {\n';
      updatedContent += `    name: "${player.name}",\n`;
      if (player.image) {
        updatedContent += `    image: "${player.image}"\n`;
      } else {
        updatedContent += `    image: null\n`;
      }
      updatedContent += '  }';
      if (index < playersArray.length - 1) {
        updatedContent += ',';
      }
      updatedContent += '\n';
    });
    
    updatedContent += '];\n\n';
    updatedContent += '// For backwards compatibility and Guess Who game (uses first 24)\n';
    updatedContent += 'export const GUESS_WHO_PLAYERS = FOOTBALL_PLAYERS.slice(0, 24);\n';
    
    // Add the comment at the top
    const finalContent = '// Shared footballer data for all games in Footy Arena\n' + updatedContent;
    
    // Write back to file
    fs.writeFileSync(playersPath, finalContent, 'utf8');
    
    console.log('✅ File updated successfully!');
    
    console.log('\n📝 Updated players:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ✅ ${r.name}`);
    });
    
    if (failCount > 0) {
      console.log('\n⚠️  Players still without images:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   ❌ ${r.name}`);
      });
    }
  } else {
    console.log('\n⚠️  No images were fetched. File not modified.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the script
console.log('\n🚀 Starting Wikipedia image fetch...\n');
updatePlayersFile().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
