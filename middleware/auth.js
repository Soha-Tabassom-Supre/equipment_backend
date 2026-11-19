import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = req.app.locals.db;

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      {
        projection: {
          role: 1,
          isBlocked: 1,
        },
      },
    );

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
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}
