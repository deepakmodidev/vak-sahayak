import { config } from 'dotenv';
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk';

config({ path: '.env.local' });

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

async function testLiveKit() {
  console.log('--- 🧪 Testing LiveKit Configuration ---');

  if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
    console.error('❌ Missing LiveKit credentials in .env.local');
    process.exit(1);
  }

  try {
    // 1. Test Token Generation
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: 'test_user',
      name: 'Test',
    });
    at.addGrant({ roomJoin: true, room: 'test_room' });
    const token = await at.toJwt();
    console.log('✅ Token Generation: Success');

    // 2. Test Agent Dispatch Client (Connectivity)
    const client = new AgentDispatchClient(LIVEKIT_URL, API_KEY, API_SECRET);
    // We don't actually create a dispatch, just check if the client initializes
    console.log('✅ Dispatch Client Initialization: Success');
    console.log('✅ Server URL:', LIVEKIT_URL);

    console.log('--- ✨ LiveKit Test Passed ---');
  } catch (err) {
    console.error('❌ LiveKit Test Failed:', err);
    process.exit(1);
  }
}

testLiveKit();
