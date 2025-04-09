import { Kafka } from "kafkajs";
import { createLogger } from "../utils";
import { KAFKA_BROKERS, KAFKA_CLIENT_ID } from "../config";
import type { NewNotificationBody } from "../api/notification/notification.schema";

interface NewExpenseMessage {
  userId: string;
  notificationInfo: {
    app: string;
    vendor: string;
    paymentMethod: string;
    amount: number;
    strTimestamptz: string;
  };
}

export class KafkaService {
  private readonly logger = createLogger(KafkaService.name);
  private readonly kafka;
  private readonly producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS,
    });
    this.producer = this.kafka.producer();
  }

  async init() {
    await this.producer.connect();
  }

  async sendNewNotification(userId: string, body: NewNotificationBody) {
    this.logger.info("Notification posted to Kafka");

    const content: NewExpenseMessage = {
      userId,
      notificationInfo: {
        app: body.app,
        vendor: body.vendor,
        paymentMethod: body.paymentMethod,
        amount: body.amount,
        strTimestamptz: body.strTimestamptz,
      },
    };

    await this.producer.send({
      topic: "notification.new",
      messages: [
        {
          value: JSON.stringify(content),
        },
      ],
    });
  }
}
