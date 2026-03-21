import { createFileRoute } from "@tanstack/react-router";
import { Categories } from "../pages/Categories";
import { ROUTES } from "./routes";
import { loadCategories } from "../lib/service/categoryService";
import { useCategoryStore } from "../lib/stores/categoryStore";

export const Route = createFileRoute(ROUTES.CATEGORIES)({
  beforeLoad: async () => {
    const categories = await loadCategories();
    useCategoryStore.getState().setAllCategories(categories);
  },
  component: Categories,
});
