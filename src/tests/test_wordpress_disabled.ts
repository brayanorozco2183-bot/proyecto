import { WPBridgeAgent } from '../agents/bridge.js';
import assert from 'assert';

async function testWordpressDisabled() {
    console.log("🧪 Testing WordPress Bridge Opt-in Logic...");
    const bridge = new WPBridgeAgent();

    // Input with enabled: false
    const input = {
        enabled: false,
        site_url: "https://example.com",
        auth_user: "admin",
        auth_pass: "pass",
        post_data: {
            title: "Test Post",
            content: "Test Content"
        }
    };

    const result = await bridge.execute(input);

    console.log("Result success:", result.success);
    console.log("Result data:", JSON.stringify(result.data));

    assert.strictEqual(result.success, true, "Bridge should return success even when skipped");
    assert.strictEqual(result.data.skipped, true, "Bridge should have skipped: true");
    assert.ok(result.thoughts.includes('desactivada'), "Thoughts should mention it is disabled");

    console.log("✅ WordPress Skip Logic Verified.");
}

testWordpressDisabled().catch(err => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});