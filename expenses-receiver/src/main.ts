import express from "express";
import { NotificationController } from "./api/notification/notificationController";
import { PORT } from "./config";
import { createLogger } from "./utils";
import { KafkaService } from "./kafka/kafkaService";

async function main() {
  const logger = createLogger("main");

  const app = express();

  // Set middleware
  app.use(express.json());

  // Create services

  const kafkaService = new KafkaService();

  await kafkaService.init();

  // Register controllers
  const controllers = [new NotificationController(kafkaService)];

  for (const controller of controllers) {
    const router = controller.build();

    app.use(controller.PATH, router);
  }

  // Start app
  app.listen(PORT, () => {
    logger.info(`App listening at port ${PORT}`);
  });
}

main();
