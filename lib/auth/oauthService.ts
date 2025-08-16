// OAuth service: verifies Google and Microsoft tokens
import axios from 'axios';

export async function verifyGoogleToken(oauthToken: string) {
  // Call Google API to verify token and extract user info
  const res = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${oauthToken}`);
  if (res.status !== 200) throw new Error('Invalid Google token');
  return { email: res.data.email, name: res.data.name };
}

export async function verifyMicrosoftToken(oauthToken: string) {
  // Call Microsoft API to verify token and extract user info
  const res = await axios.get(`https://graph.microsoft.com/v1.0/me`, {
    headers: { Authorization: `Bearer ${oauthToken}` }
  });
  if (res.status !== 200) throw new Error('Invalid Microsoft token');
  return { email: res.data.mail || res.data.userPrincipalName, name: res.data.displayName };
}
