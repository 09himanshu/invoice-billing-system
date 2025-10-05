import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";

// custom imports
import { env } from "./config/env.config";
import { errorMiddleware } from "./middleware/error.middleware";
import { helmetUtils } from "./utils/helmet.utils";
import {KafkaService} from './class/kafka.class'
import {kafkaTopics} from './utils/constants.utils'

// imports routes
import routes from "./routes/index";

// Kafka object
const kafka = KafkaService.getInstance();



(async (): Promise<void> => {
  const app = express();
  console.log(env)
  try {
    // Middlewares
    app.use(express.json());
    app.use(cors());

    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
      console.log("Headers:", req.headers);
      console.log("Query:", req.query);

      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
          `[RESPONSE] Status: ${res.statusCode} ${res.statusMessage}`
        );
        console.log("Response time:", `${duration}ms`);
        console.log("Response headers:", res.getHeaders());
      });

      next();
    });

    // use master routes
    app.use("/api/v1", routes);

    // Security with Helmet
    if (process.env.NODE_ENV === "development") {
      app.use(helmet(helmetUtils.development));
    } else {
      app.use(helmet(helmetUtils.production));
    }


    // Error handling middleware should be last
    app.use(errorMiddleware);

    // Kafka topic creation
    await kafka.createTopics(Object.values(kafkaTopics))

    const PORT = Number(env.PORT);
    const HOST = String(env.HOST);

    app.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("Error during initialization:", err);
    process.exit(1);
  }
})();
