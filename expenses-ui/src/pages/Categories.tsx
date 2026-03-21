import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { EditCategoryModal } from "../components/EditCategoryModal";
import { NewCategoryModal } from "../components/NewCategoryModal";
import { ROUTES } from "../routes/routes";
import { Button } from "../components/ui/button";

export function Categories() {
  const categories = useCategoryStore((state) => state.categories);
  const addCategory = useCategoryStore((state) => state.addCategory);
  const updateCategory = useCategoryStore((state) => state.updateCategory);
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage your categories</p>
        </div>
        <NewCategoryModal onCreated={addCategory} />
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No categories yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr
                  key={category.id}
                  className={`${
                    index < categories.length - 1 ? "border-b border-slate-700/50" : ""
                  } hover:bg-slate-800/30 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditCategoryModal category={category} onUpdated={updateCategory} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          navigate({ to: ROUTES.CATEGORY_DETAIL, params: { id: category.id } })
                        }
                        title="View expenses"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
