import { type RequestHandler, Router } from "express";
import { createLogger } from "../../utils";
import type { NewNotificationRequest } from "./notification.schema";
import type { KafkaService } from "../../kafka/kafkaService";
import { CLIENT_SECRET } from "../../config";

export class NotificationController {
  private readonly logger = createLogger(NotificationController.name);
  readonly PATH = "/notification";

  constructor(private readonly kafkaService: KafkaService) {}

  build() {
    const router = Router();
    router.post("/", this.handleRootPost);

    return router;
  }

  handleRootPost: RequestHandler = async (req: NewNotificationRequest, res) => {
    try {
      const { body } = req;

      // user ID in db
      const clientId = req.get("Client-Id");
      // custom client secret
      const clientSecret = req.get("Client-Secret");

      /*
        This is a really bad and not scalable auth check. That being said it is good
        enough considering just me and my friends will be using this
      */
      if (clientSecret !== CLIENT_SECRET) {
        res.status(401);
        res.send("Unauthorized");
        return;
      }

      if (!clientId || typeof clientId !== "string") {
        res.status(400);
        res.send('Incorrect header: "Client-Id"');
        return;
      }

      await this.kafkaService.sendNewNotification(clientId, body);

      res.status(201);
      res.send("Notification saved");
    } catch (e: unknown) {
      res.status(500);
      res.send("Internal Server Error");
      this.logger.error({
        message: e,
      });
    }
  };
}
