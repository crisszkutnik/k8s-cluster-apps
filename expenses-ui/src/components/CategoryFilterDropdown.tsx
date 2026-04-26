import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Filter, X, Search } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useIsMobile } from "../hooks/use-mobile";
import type { Category } from "../lib/types";

interface CategoryFilterDropdownProps {
  categories: Category[];
  excludedCategoryIds: string[];
}

export function CategoryFilterDropdown({
  categories,
  excludedCategoryIds,
}: CategoryFilterDropdownProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedCategories = useMemo(() => {
    return categories.filter((cat) => excludedCategoryIds.includes(cat.id));
  }, [categories, excludedCategoryIds]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const search = searchTerm.toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(search));
  }, [categories, searchTerm]);

  const handleToggleCategory = (categoryId: string) => {
    const newExcluded = excludedCategoryIds.includes(categoryId)
      ? excludedCategoryIds.filter((id) => id !== categoryId)
      : [...excludedCategoryIds, categoryId];

    const currentSearch = router.latestLocation.search as {
      month?: string;
      year?: number;
      view?: "monthly" | "yearly";
    };

    void router.navigate({
      to: "/",
      search: {
        month: currentSearch.month,
        year: currentSearch.year,
        view: currentSearch.view,
        excludedCategories: newExcluded.length > 0 ? newExcluded.join(",") : undefined,
      },
      replace: true,
    });
  };

  const handleClearAll = () => {
    const currentSearch = router.latestLocation.search as {
      month?: string;
      year?: number;
      view?: "monthly" | "yearly";
    };

    void router.navigate({
      to: "/",
      search: {
        month: currentSearch.month,
        year: currentSearch.year,
        view: currentSearch.view,
        excludedCategories: undefined,
      },
      replace: true,
    });
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm("");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => handleOpenChange(!isOpen)}
        className={`flex items-center gap-2 ${isMobile ? "w-full justify-center py-2.5" : ""} ${
          selectedCategories.length > 0 ? "border-orange-600 bg-orange-600/10" : ""
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="font-semibold">
          {selectedCategories.length > 0
            ? `Excluding ${selectedCategories.length}`
            : "Filter Categories"}
        </span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => handleOpenChange(false)}
          />
          <div
            className={`${
              isMobile
                ? "fixed inset-x-4 top-1/2 -translate-y-1/2"
                : "absolute right-0 mt-2"
            } ${
              isMobile ? "w-auto" : "w-96"
            } bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50 p-4 max-h-[500px] flex flex-col`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
              <span className="text-lg font-semibold text-white">
                Exclude Categories
              </span>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-600/10"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => {
                  const isExcluded = excludedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleToggleCategory(category.id)}
                      className={`w-full ${
                        isMobile ? "py-3" : "py-2"
                      } px-3 rounded-md text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        isExcluded
                          ? "bg-orange-600 text-white shadow-md ring-2 ring-orange-500/50"
                          : "bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white"
                      }`}
                    >
                      <span className="truncate text-left">{category.name}</span>
                      {isExcluded && <X className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No categories found
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="w-full mt-4 hover:bg-slate-700"
            >
              Close
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
