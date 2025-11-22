import { DiscordSDK } from '@discord/embedded-app-sdk';

let discordSdk: DiscordSDK | null = null;

export async function initializeDiscord() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!clientId || isLocal) {
    console.warn('Discord Client ID not configured or running locally, using mock data');
    return {
      userId: 'test-user-' + Math.random().toString(36).substr(2, 9),
      channelId: 'test-channel',
      username: 'TestUser',
      discriminator: '1234',
      avatar: null,
    };
  }

  discordSdk = new DiscordSDK(clientId);
  await discordSdk.ready();

  // For Discord Activities, use authorize + authenticate flow
  const { code } = await discordSdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify', 'guilds'],
  });

  // Exchange code for token via backend (CSP blocks direct Discord API calls)
  // Use relative URL to avoid CSP issues - proxied by Vite in dev, routed by Cloudflare in prod
  const tokenResponse = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const { access_token, user } = await tokenResponse.json();

  // Now authenticate with the access token
  const auth = await discordSdk.commands.authenticate({ access_token });

  if (!auth || !auth.user) {
    throw new Error('Authentication failed - no user returned');
  }

  return {
    userId: user.id,
    channelId: discordSdk.channelId || 'unknown-channel',
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,
  };
}

export function getDiscordSDK() {
  return discordSdk;
}
