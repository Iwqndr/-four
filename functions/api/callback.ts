export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const CLIENT_ID = context.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = context.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = "https://fourhrts.pages.dev/api/callback";

  // 1. Exchange the code for an access token
  const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const tokens = await tokenResponse.json();
  if (tokens.error) {
    return new Response(JSON.stringify(tokens), { status: 400 });
  }

  // 2. Update the user's role connection metadata (THIS is what makes it appear)
  const updateResponse = await fetch(`https://discord.com/api/v10/users/@me/applications/${CLIENT_ID}/role-connection`, {
    method: "PUT",
    body: JSON.stringify({
      platform_name: "fourhrts", // The name that shows next to the icon
      platform_username: "@fourhrt", // Your site username/handle
      metadata: {
        verified: 1 // This MUST match the metadata key we registered
      },
    }),
    headers: {
      "Authorization": `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.text();
    return new Response(`Failed to update connection: ${errorBody}`, { status: 500 });
  }

  return new Response("Successfully linked! You can now close this tab. Your custom name should now appear in your Discord Connections list.");
}
