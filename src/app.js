import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({
    path: "./env",
});

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

//accept json data
app.use(express.json({ limit: "16kb" }));

// to take data from the url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// temporary storage for the file storing on server
app.use(express.static("public"));

app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";
import healthRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweets.routes.js";
import subscriptionRouter from "./routes/subscriptions.routes.js";
import videoRouter from "./routes/videos.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/likes.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/healthcheck", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// routes declaration

// https://localhost:8000/api/v1/users/register

// Swagger UI
import swaggerUi from "swagger-ui-express";
// import swaggerDocument from "../docs/swagger-output.json" assert { type: "json" };
const swaggerDocument = JSON.parse(
    fs.readFileSync(new URL("../docs/swagger-output.json", import.meta.url))
);


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get("/",(_,res) => {
    res.redirect("/api-docs");
})


export { app };
