import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./routes/index.js";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
dotenv.config();

// * Routes
app.use(routes);


app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is alive on port ${process.env.PORT}`
  );
});
 
 