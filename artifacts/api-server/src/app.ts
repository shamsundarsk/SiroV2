import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import db from "./services/database";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
db.initialize().catch(console.error);

app.use("/api", router);

export default app;
