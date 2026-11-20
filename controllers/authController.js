import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";



export async function register(req, res) {
  try {
    const nameValue = req.body.name?.trim();
    const emailValue = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role;

    
    if (!nameValue || !emailValue || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

  
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    
    const userRole = role || "customer";

    if (!["customer", "owner"].includes(userRole)) {
      return res.status(400).json({
        message: "Invalid user role.",
      });
    }

    const db = req.app.locals.db;

    
    const existingUser = await db.collection("users").findOne({
      email: emailValue,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

   
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name: nameValue,
      email: emailValue,
      password: hashedPassword,
      role: userRole,
      isBlocked: false,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

   
    const token = jwt.sign(
      {
        userId: result.insertedId.toString(),
        role: userRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        id: result.insertedId,
        name: nameValue,
        email: emailValue,
        role: userRole,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}



export async function login(req, res) {
  try {
    const emailValue = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

   
    if (
      typeof emailValue !== "string" ||
      !emailValue ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }


    const db = req.app.locals.db;

    const user = await db.collection("users").findOne({
      email: emailValue,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

   
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

  
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}




export async function googleLogin(req, res) {
  try {
     
    const idToken = req.body?.idToken;

    if (typeof idToken !== "string" || !idToken.trim()) {
      return res.status(400).json({
        message: "A valid Google ID token is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        message: "Google authentication is not configured.",
      });
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({
      message: "Google account verification failed.",
    });
  }

    const db = req.app.locals.db;

    const email = payload.email.toLowerCase();

    let user = await db.collection("users").findOne({
      googleId: payload.sub,
    });

    if (!user) {
      user = await db.collection("users").findOne({ email });

      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({
            message: "This email is linked to another Google account.",
          });
        }

        if (user.isBlocked) {
          return res.status(403).json({
            message: "Your account has been blocked.",
          });
        }

        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              googleId: payload.sub,
              authProvider: "google",
              updatedAt: new Date(),
            },
          },
        );

        user.googleId = payload.sub;
      } else {
        const newUser = {
          name: payload.name || email.split("@")[0],
          email,
          googleId: payload.sub,
          role: "customer",
          authProvider: "google",
          isBlocked: false,
          createdAt: new Date(),
        };

        const result = await db.collection("users").insertOne(newUser);

        user = {
          _id: result.insertedId,
          ...newUser,
        };
      }
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Google login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      message: "Google authentication failed.",
    });
  }
}
