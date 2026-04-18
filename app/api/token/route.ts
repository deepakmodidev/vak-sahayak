import { NextResponse } from 'next/server';
import {
  AccessToken,
  type AccessTokenOptions,
  AgentDispatchClient,
  type VideoGrant,
} from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

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
  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'THIS API ROUTE IS INSECURE. DO NOT USE THIS ROUTE IN PRODUCTION WITHOUT AN AUTHENTICATION LAYER.'
    );
  }

  try {
    if (!LIVEKIT_URL) throw new Error('LIVEKIT_URL is not defined');
    if (!API_KEY) throw new Error('LIVEKIT_API_KEY is not defined');
    if (!API_SECRET) throw new Error('LIVEKIT_API_SECRET is not defined');

    const body = await req.json();
    const { serviceType, dispatch, roomName, participantIdentity } = body;

    if (!serviceType) {
      return new NextResponse('MISSING_SERVICE_TYPE: Service type must be provided.', { status: 400 });
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

    if (dispatch === true) {
      const agentDispatchClient = new AgentDispatchClient(LIVEKIT_URL, API_KEY, API_SECRET);
      await agentDispatchClient.createDispatch(roomName, 'vak-sahayak', {
        metadata: JSON.stringify({ branding: 'Vak Sahayak', serviceType }),
      });
      console.log(`--- 🚀 DISPATCH: ${serviceType} in ${roomName} ---`);
    } else {
      console.log(`--- 🎫 TOKEN: ${participantIdentity} ---`);
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
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
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
