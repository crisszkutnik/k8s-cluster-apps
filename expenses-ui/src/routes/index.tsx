import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../pages/Home";
import { ROUTES } from "./routes";

export const Route = createFileRoute(ROUTES.HOME)({
  component: Home,
});
