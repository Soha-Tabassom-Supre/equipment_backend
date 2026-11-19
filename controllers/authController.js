import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
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
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
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

    res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        id: result.insertedId,
        name,
        email: email.toLowerCase(),
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Internal server error.",
    });
  }
}
