import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import dotenv from "dotenv";

import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

const webOrigin = process.env.WEB_ORIGIN || "http://localhost:3000";

app.use(helmet());
app.use(cors({ origin: webOrigin, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 200)
});
app.use(limiter);

app.use(pinoHttp());

app.use("/api", routes);

app.use(errorHandler);

export default app;
