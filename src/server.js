import express from "express";
import winston from "winston";
import errorHandler from "./middleware/errorHandler.js";
import router from "./routes.js";

global.fileName = "pedidos.json";

const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

global.logger = winston.createLogger({
    level: "silly",
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: "delivery_api_log.log" })
    ],
    format: combine(
        label({ label: "delivery_api"}),
        timestamp(),
        myFormat
    )
});

const app = express();

app.use(express.json());

app.use("/orders", router);
app.use(errorHandler);

app.listen(4000, () => {
  console.log("Server started!!!");
  logger.info("API Started!");
});

