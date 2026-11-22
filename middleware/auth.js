import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

let betterAuthJWKS;

function getBetterAuthJWKS() {
  if (!betterAuthJWKS) {
    const baseURL = process.env.BETTER_AUTH_URL;

    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is missing.");
    }

    const jwksURL = new URL("/api/auth/jwks", baseURL);

    betterAuthJWKS = createRemoteJWKSet(jwksURL);
  }

  return betterAuthJWKS;
}

async function findUser(db, userId) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return db.collection("users").findOne(
    {
      $or: [{ _id: new ObjectId(userId) }, { _id: userId }],
    },
    {
      projection: {
        role: 1,
        isBlocked: 1,
      },
    },
  );
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const db = req.app.locals.db;

    let decoded;
    let userId;

   
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      
      const baseURL = process.env.BETTER_AUTH_URL;

      const result = await jwtVerify(token, getBetterAuthJWKS(), {
        issuer: baseURL,
        audience: baseURL,
      });

      decoded = result.payload;
      userId = decoded.sub;
    }

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token: user ID missing.",
      });
    }

    const user = await findUser(db, userId);

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked.",
      });
    }

    req.user = {
      ...decoded,
      userId: userId.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}
