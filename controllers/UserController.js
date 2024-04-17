import prisma from "../db/index.js";
import bcrypt from "bcrypt";
import path from "path";
import Jimp from "jimp";
import fs from "fs";
import mime from "mime-types";

export const findUsersByEmail = async (req, res) => {
  const email = req.params.email;

  if (!email || email.length < 3) {
    return res.status(400).json({});
  }

  const user = await prisma.user.findMany({
    where: {
      email: {
        startsWith: email,
      },
    },
    select: {
      id: true,
      email: true,
      full_name: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  console.log(user);

  return res.status(200).json(user[0]);
};

export const getUserById = async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      login: true,
      email: true,
      full_name: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(200).json(user);
};

export const createUser = async (req, res) => {
  const { email, password, full_name } = req.body;

  const login = full_name;

  if (!email || !password || !full_name) {
    return res.status(400).json({ message: "Missing parameters." });
  }

  const findUserByEmail = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  const findUserByLogin = await prisma.user.findUnique({
    where: {
      login: login,
    },
  });

  if (findUserByEmail) {
    return res
      .status(400)
      .json({ message: "Email already taken, please try another one." });
  }
  if (findUserByLogin) {
    return res
      .status(400)
      .json({ message: "Login already taken, please try another one." });
  }

  const cryptedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      login: login,
      email: email,
      password: cryptedPassword,
      full_name: full_name,
    },
  });

  return res.status(201).json({ message: "User created successfully." });
};

export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { login, email, password, full_name } = req.body;

  let cryptedPassword;
  if (password) {
    cryptedPassword = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      login: login,
      email: email,
      password: cryptedPassword || password,
      full_name: full_name,
    },
  });

  return res.status(200).json({ message: "User updated successfully." });
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return res.status(200).json({ message: "User deleted successfully." });
};

export const getUserAvatar = async (req, res) => {
  const { email } = req.params;

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const avatarPath = path.join(
    process.cwd(),
    "public",
    "avatars",
    `${user.id}.png`
  );

  if (fs.existsSync(avatarPath)) {
    return res.status(200).sendFile(avatarPath);
  }

  const defaultAvatarPath = path.join(
    process.cwd(),
    "public",
    "avatars",
    "default.png"
  );

  return res.status(200).sendFile(defaultAvatarPath);
};

export const updateUserAvatar = async (req, res) => {
  const { userId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file provided." });
  }

  const mimeType = mime.lookup(req.file.originalname);
  if (!mimeType || !mimeType.startsWith("image/")) {
    return res
      .status(400)
      .json({ message: "Invalid file format. Only images are allowed." });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const avatarPath = path.join(
    process.cwd(),
    "public",
    "avatars",
    `${user.id}.png`
  );

  const resizeSize = 512;

  const avatarImage = await Jimp.read(req.file.path);
  await avatarImage.cover(resizeSize, resizeSize).write(avatarPath);
  fs.unlinkSync(req.file.path);

  return res.status(200).json({ message: "Avatar updated successfully." });
};