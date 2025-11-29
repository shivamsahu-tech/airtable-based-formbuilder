// file: airtableAuth.js
import crypto from "crypto";
import axios from "axios";
import User from "../models/User.js";

const CLIENT_ID = process.env.AIRTABLE_CLIENT_ID ;
const CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET ;
const REDIRECT_URI = process.env.AIRTABLE_REDIRECT_URI ;

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

export function startLogin(req, res) {
  const state = crypto.randomUUID();
  const code_verifier = codeVerifier();
  const code_challenge = codeChallenge(code_verifier);

  req.session.oauthState = state;
  req.session.codeVerifier = code_verifier;

  // console.log(req.sessionID, " ", state)

  const authUrl = new URL("https://airtable.com/oauth2/v1/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", code_challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("scope", "data.records:read data.records:write schema.bases:read");

  // console.log("Auth String: ", authUrl.toString());
  res.redirect(authUrl.toString());
}



export async function handleCallback(req, res) {
  const { code, state } = req.query;
  console.log(code , " " , state);

  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }
  if (state !== req.session.oauthState) {
    return res.status(400).send("Invalid state");
  }
  const code_verifier = req.session.codeVerifier;
  if (!code_verifier) {
    return res.status(400).send("Missing code_verifier in session");
  }

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

    const { id: airtableUserId } = whoamiResponse.data;

    const user = await User.findOneAndUpdate(
      { airtableUserId: airtableUserId }, 
      {
        accessToken: tokens.access_token,
        lastLoginAt: new Date(),
      },
      {
        upsert: true,         
        new: true,            
        setDefaultsOnInsert: true,
      }
    );
    // console.log("user : ", user);

    req.session.userId = user._id;

    const frontendDashboardUrl = process.env.FRONTEND_REDIRECT_URL; 

    const redirectUrl = new URL(frontendDashboardUrl);
    redirectUrl.searchParams.set('auth_status', 'success');
    console.log("redirecting to ", redirectUrl.toString());
    return res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error("airtable auth failed : ", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res.status(status).send("airtable auth failed");
  }
}


export async function getCurrentUser(req, res) {
  console.log("user id ",req.sessionID);
  const userId = req.session.userId; 
  
  if (!userId) {
    return res.status(401).json({ message: 'unauthorized' });
  }

  const user = await User.findById(userId);

  res.json({
    id: user._id,
    lastLoginAt: user.lastLoginAt,
    isAirtableLinked: !!user.accessToken 
  });
}

export function logout(req, res, next) {
  console.log("logging out ", req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.status(204).end();
  });
}