import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

interface YearPickerProps {
  currentYear: string; // "YYYY" format
}

export function YearPicker({ currentYear }: YearPickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse current year
  const year = parseInt(currentYear);
  const currentYearDate = new Date(year, 0, 1);
  
  // Calculate the decade to show (e.g., 2020-2029)
  const [decadeStart, setDecadeStart] = useState(Math.floor(year / 10) * 10);
  
  const handleYearSelect = (selectedYear: number) => {
    void router.navigate({
      to: "/",
      search: (prev) => ({ ...prev, year: selectedYear, view: "yearly" }),
      replace: true,
    });
    setIsOpen(false);
  };
  
  const handlePreviousDecade = () => {
    setDecadeStart(decadeStart - 10);
  };
  
  const handleNextDecade = () => {
    setDecadeStart(decadeStart + 10);
  };
  
  // Generate array of years for the current decade
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i - 1);
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span className="font-semibold">{currentYear}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50 p-4">
          {/* Decade Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousDecade}
              className="p-2 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold">
              {decadeStart} - {decadeStart + 9}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDecade}
              className="p-2 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Year Grid */}
          <div className="grid grid-cols-3 gap-2">
            {years.map((yearValue) => {
              const isCurrentYear = yearValue === year;
              const isOutOfRange = yearValue < decadeStart || yearValue > decadeStart + 9;

              return (
                <button
                  key={yearValue}
                  onClick={() => handleYearSelect(yearValue)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                    isCurrentYear
                      ? "bg-blue-600 text-white"
                      : isOutOfRange
                      ? "bg-slate-950 text-gray-500"
                      : "bg-slate-800 hover:bg-slate-700 text-gray-300"
                  }`}
                >
                  {yearValue}
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

