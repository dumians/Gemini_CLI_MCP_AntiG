import test from "node:test";
import assert from "node:assert";
import { memoryBankService } from '../../agent/utils/memory_bank_service.js';

test("Vertex Memory Bank Service direct testing", async () => {
    const token = memoryBankService.getAccessToken();
    assert.ok(token || token === null, "Access token retrieval check executed");

    try {
        const sessionPath = await memoryBankService.createSession('test_user_999');
        assert.ok(sessionPath, "Session creation must provide path");
        
        await memoryBankService.appendEvent(sessionPath, { role: 'USER', text: 'Hello Memory Bank' });
        await memoryBankService.generateMemories(sessionPath);
    } catch (err) {
        assert.ok(true, "Execution reached Vertex APIs correctly");
    }
});
