import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";
import otplib from 'otplib'

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"));
app.use(cookieParser());



//routes import
import userRouter from "./routes/user.routes.js";

//routes declartion
app.use("/api/v1/users", userRouter);

app.get("/clear-cookies", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  // Clear any other cookies you might have set
  res.send("Cookies cleared");
});

// app.use((err, req, res, next) => {
//   console.error(err); // Log the error for debugging

//   res.status(err.status).json(new ApiError(err.status, err.message));
// });

export { app };
