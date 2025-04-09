import type { Request } from "express";

export interface NewNotificationBody {
  app: string;
  vendor: string;
  paymentMethod: string;
  amount: number;
  strTimestamptz: string;
}

export interface NewNotificationRequest extends Request {
  body: NewNotificationBody;
}
