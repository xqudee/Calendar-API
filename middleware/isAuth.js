import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const SECRET_KEY = 'secret_key'

export const isAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next();
  }

  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Token expired." });
  }
};
