import prisma from "../db/index.js";

import bcrypt from "bcrypt";
import dotenv from "dotenv";

// import { sendEmail } from "../tools/sendEmail.js";
// import { resetPasswordHTML } from "../public/emails/resetPasswordHTML.js";
// import { generateRandomCode, jwtGenerator } from "../tools/auth.js";

dotenv.config();

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing parameters." });
    }
  
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }
  
    // const token = jwtGenerator(user.id, user.email, user.full_name);
    // res.cookie("token", token, { httpOnly: false, expiresIn: "2h" });
    return res.status(200).json({
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        full_name: user.full_name,
      },
      message: "Login successful",
    });
};

export const register = async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ message: "Missing parameters." });
  }

  const findUserByEmail = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (findUserByEmail) {
    return res
      .status(400)
      .json({ message: "Email already taken, please try another one." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      full_name: full_name,
    },
  });

  const calendar = await prisma.calendar.create({
    data: {
      name: user.email,
      description: "Default calendar for user",
      isMain: true,
    },
  });

  await prisma.userCalendars.create({
    data: {
      userId: user.id,
      calendarId: calendar.id,
      role: "ADMIN",
      isConfirmed: true,
    },
  });

  return res.status(201).json({ message: "Registration successful!" });
};
  