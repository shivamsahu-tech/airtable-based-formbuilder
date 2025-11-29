import crypto from "crypto";
import axios from "axios";
import User from "../models/User.js";

const CLIENT_ID = process.env.AIRTABLE_CLIENT_ID;
const CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.AIRTABLE_REDIRECT_URI;

function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function codeVerifier() {
  return base64url(crypto.randomBytes(32));
}

function codeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64url(hash);
}

let redisClient;

export function setRedisClient(client) {
  redisClient = client;
}

export async function startLogin(req, res) {
  const state = crypto.randomUUID();
  const code_verifier = codeVerifier();
  const code_challenge = codeChallenge(code_verifier);

  await redisClient.setEx(
    `oauth:${state}`,
    600, 
    JSON.stringify({
      code_verifier,
      timestamp: Date.now()
    })
  );

  console.log("OAuth state stored:", state);
  console.log("code_verifier stored in Redis:", code_verifier);

  const authUrl = new URL("https://airtable.com/oauth2/v1/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", code_challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("scope", "data.records:read data.records:write schema.bases:read");

  res.redirect(authUrl.toString());
}

export async function handleCallback(req, res) {
  const { code, state } = req.query;
  console.log("In callback code: ", code, " state: ", state);

  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }

  const oauthDataJson = await redisClient.get(`oauth:${state}`);
  
  if (!oauthDataJson) {
    console.error("State not found in Redis - possible replay attack or expired state");
    return res.status(400).send("Invalid or expired state");
  }

  const oauthData = JSON.parse(oauthDataJson);
  const code_verifier = oauthData.code_verifier;

  console.log("Retrieved code_verifier from Redis:", code_verifier);

  await redisClient.del(`oauth:${state}`);

  try {
    const tokenResponse = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code_verifier: code_verifier
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    console.log("Token received");
    const tokens = tokenResponse.data;

    const whoamiResponse = await axios.get(
      "https://api.airtable.com/v0/meta/whoami",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    );

    console.log("Whoami response:", whoamiResponse.data);
    const { id: airtableUserId } = whoamiResponse.data;

    const user = await User.findOneAndUpdate(
      { airtableUserId: airtableUserId },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token, 
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        lastLoginAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("User logged in with id:", user._id);

    req.session.userId = user._id.toString();

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          reject(err);
        } else {
          console.log("Session saved successfully, sessionId:", req.sessionID);
          resolve();
        }
      });
    });

    const frontendDashboardUrl = process.env.FRONTEND_REDIRECT_URL;
    const redirectUrl = new URL(frontendDashboardUrl);
    redirectUrl.searchParams.set('auth_status', 'success');
    
    console.log("Redirecting to:", redirectUrl.toString());
    return res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error("Airtable auth failed:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    
    const frontendDashboardUrl = process.env.FRONTEND_REDIRECT_URL;
    const redirectUrl = new URL(frontendDashboardUrl);
    redirectUrl.searchParams.set('auth_status', 'failed');
    redirectUrl.searchParams.set('error', err.message);
    
    return res.redirect(redirectUrl.toString());
  }
}

export async function getCurrentUser(req, res) {
  console.log("SessionID:", req.sessionID);
  console.log("Session data:", req.session);
  
  const userId = req.session.userId;
  console.log("Fetched userId from session:", userId);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - no session' });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      lastLoginAt: user.lastLoginAt,
      isAirtableLinked: !!user.accessToken
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: 'Error fetching user' });
  }
}

export function logout(req, res, next) {
  console.log("Logging out, sessionID:", req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return next(err);
    }
    res.clearCookie('sessionId', { 
      path: '/',
      domain: process.env.COOKIE_DOMAIN, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    });
    res.status(200).json({ message: 'Logged out successfully' });
  });
}