import test from "node:test";
import assert from "node:assert";
import jwt from "../../server/node_modules/jsonwebtoken/index.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-mesh-os";

test("API Server: Basic Integrity", async () => {
    assert.strictEqual(process.env.NODE_ENV, 'test');
});

test("API Server: GET /api/mesh/cross_inventory returns resilient 200 OK", async () => {
    const { app } = await import("../../server/server.js");
    
    // Start temporary test server listener
    const server = app.listen(0);
    const port = server.address().port;
    
    try {
        const token = jwt.sign({ username: 'admin', role: 'admin' }, process.env.JWT_SECRET);
        const res = await fetch(`http://localhost:${port}/api/mesh/cross_inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.status, 'success');
        assert.ok(typeof data.summary === 'string');
        assert.ok(Array.isArray(data.steps));
    } finally {
        server.close();
    }
});
