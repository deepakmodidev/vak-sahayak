import { NextResponse } from 'next/server';
import {
  AccessToken,
  type AccessTokenOptions,
  AgentDispatchClient,
  type VideoGrant,
} from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import { auth } from '@/lib/auth/server';

const AGENT_NAME = 'vak-sahayak';

// Rooms with an in-flight dispatch — dedupes concurrent token requests in-process.
const pendingDispatch = new Set<string>();

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // Auth gate: this token + agent-dispatch endpoint is now behind Neon Auth.
    // `getSession()` reads the session cookie itself, so the (req: Request)
    // signature is unchanged. Anyone reaching this URL still needs a valid
    // session to mint LiveKit tokens / dispatch agents. (Rate limiting is still
    // recommended before real production use.)
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return new NextResponse('UNAUTHORIZED', { status: 401 });
    }

    if (!LIVEKIT_URL) throw new Error('LIVEKIT_URL is not defined');
    if (!API_KEY) throw new Error('LIVEKIT_API_KEY is not defined');
    if (!API_SECRET) throw new Error('LIVEKIT_API_SECRET is not defined');

    const body = await req.json();
    const { serviceType, dispatch, roomName, participantIdentity } = body;

    if (!serviceType) {
      return new NextResponse('MISSING_SERVICE_TYPE: Service type must be provided.', { status: 400 });
    }
    if (!FORM_SCHEMAS[serviceType]) {
      return new NextResponse(`INVALID_SERVICE_TYPE: "${serviceType}" is not a known form.`, { status: 400 });
    }
    if (!roomName || !participantIdentity) {
      return new NextResponse('MISSING_SESSION_IDS: Sticky session IDs must be provided by frontend.', { status: 400 });
    }

    const roomConfig = body?.room_config
      ? RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true })
      : undefined;

    // Derived identifiers - no random generation on backend to ensure sticky sessions

    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName,
      roomConfig
    );

    // Only dispatch on the request that carries the user's real selection: the client
    // sets `dispatch: true` after the user picks a service. An earlier pre-connect token
    // fetch (LiveKit prepareConnection) arrives with dispatch:false and the DEFAULT
    // serviceType — dispatching on that would lock the room to the wrong form.
    if (dispatch === true && !pendingDispatch.has(roomName)) {
      pendingDispatch.add(roomName);
      try {
        const agentDispatchClient = new AgentDispatchClient(LIVEKIT_URL, API_KEY, API_SECRET);
        const existing = await agentDispatchClient.listDispatch(roomName).catch(() => []);
        const hasCorrect = existing.some((d) => {
          try {
            return JSON.parse(d.metadata ?? '{}').serviceType === serviceType;
          } catch {
            return false;
          }
        });
        if (hasCorrect) {
          console.log(`--- ♻️ DISPATCH EXISTS (${serviceType}) in ${roomName} ---`);
        } else {
          // Remove any stale dispatch (wrong/default serviceType), then dispatch the right one.
          await Promise.all(
            existing.map((d) => agentDispatchClient.deleteDispatch(d.id, roomName).catch(() => {}))
          );
          // Send the resolved schema (icon-stripped — React components aren't
          // serializable, and the agent doesn't need them) so the agent stays
          // schema-agnostic. lib/form-schemas.ts is the single source of truth.
          const form = FORM_SCHEMAS[serviceType];
          await agentDispatchClient.createDispatch(roomName, AGENT_NAME, {
            metadata: JSON.stringify({
              branding: 'Vak Sahayak',
              serviceType,
              schema: {
                title: form.title,
                fields: form.fields.map((f) => ({ id: f.id, label: f.label })),
              },
            }),
          });
          console.log(`--- 🚀 DISPATCH: ${serviceType} in ${roomName} ---`);
        }
      } finally {
        pendingDispatch.delete(roomName);
      }
    } else {
      console.log(`--- 🎫 TOKEN (no dispatch): ${serviceType} in ${roomName} ---`);
    }

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName: participantIdentity,
      participantToken,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(message, { status: 500 });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  roomConfig?: RoomConfiguration
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (roomConfig) {
    at.roomConfig = roomConfig;
  }

  return at.toJwt();
}
