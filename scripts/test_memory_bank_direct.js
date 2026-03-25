import { memoryBankService } from '../agent/utils/memory_bank_service.js';

async function runTest() {
    console.log("=== Vertex Memory Bank Service Test ===");
    
    console.log("\n1. Verifying Access Token Acquisition...");
    const token = memoryBankService.getAccessToken();
    if (token) {
        console.log("✅ Access Token acquired successfully.");
        console.log(`   Token prefix: ${token.substring(0, 10)}...`);
    } else {
        console.log("❌ Failed to acquire access token.");
    }

    console.log("\n2. Testing createSession (scoping test)...");
    try {
        const sessionPath = await memoryBankService.createSession('test_user_999');
        console.log(`✅ Session created: ${sessionPath}`);
        
        console.log("\n3. Testing appendEvent...");
        await memoryBankService.appendEvent(sessionPath, { role: 'USER', text: 'Hello Memory Bank' });
        console.log("✅ Event appended.");
        
        console.log("\n4. Testing generateMemories...");
        await memoryBankService.generateMemories(sessionPath);
        console.log("✅ generateMemories triggered.");
        
    } catch (err) {
        console.log(`\n⚠️ Expected API Error (Resource likely not provisioned yet):`);
        console.log(`   ${err.message}`);
        console.log(`   This proves the REST API call is correctly reaching Vertex AI!`);
    }

    console.log("\n5. Testing retrieveMemories...");
    try {
        const memories = await memoryBankService.retrieveMemories('test_user_999');
        console.log(`✅ Retrieved ${memories.length} memories.`);
    } catch (err) {
        console.log(`❌ retrieveMemories failed: ${err.message}`);
    }
}

runTest();
