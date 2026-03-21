import axios from "axios";
import type { Category } from "../types";

export async function loadCategories(): Promise<Category[]> {
  const { data } = await axios.get<Category[]>(
    `${import.meta.env.VITE_API_BASE_URL}/category`,
  );
  return data;
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await axios.post<Category>(
    `${import.meta.env.VITE_API_BASE_URL}/category`,
    { name },
  );
  return data;
}

export async function updateCategory(id: string, name: string): Promise<void> {
  await axios.patch(
    `${import.meta.env.VITE_API_BASE_URL}/category/${id}`,
    { name },
  );
}
