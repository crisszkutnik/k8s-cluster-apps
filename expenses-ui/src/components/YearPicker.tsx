import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useIsMobile } from "../hooks/use-mobile";

interface YearPickerProps {
  currentYear: string; // "YYYY" format
}

export function YearPicker({ currentYear }: YearPickerProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Parse current year
  const year = parseInt(currentYear);

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
    <div className="relative w-full">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${isMobile ? "w-full justify-center py-2.5" : ""}`}
      >
        <Calendar className="w-4 h-4" />
        <span className="font-semibold">{currentYear}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className={`${isMobile ? "fixed inset-x-4 top-1/2 -translate-y-1/2" : "absolute right-0 mt-2"} w-${isMobile ? "auto" : "72"} bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50 p-4`}>
            {/* Decade Navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousDecade}
                className="p-2 h-8 w-8 hover:bg-blue-600 hover:border-blue-600 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold text-white">
                {decadeStart} - {decadeStart + 9}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDecade}
                className="p-2 h-8 w-8 hover:bg-blue-600 hover:border-blue-600 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Year Grid */}
            <div className="grid grid-cols-3 gap-2">
              {years.map((yearValue) => {
                const isCurrentYear = yearValue === year;
                const isOutOfRange =
                  yearValue < decadeStart || yearValue > decadeStart + 9;

                return (
                  <button
                    key={yearValue}
                    onClick={() => handleYearSelect(yearValue)}
                    className={`${isMobile ? "py-3" : "py-2"} px-3 rounded-md text-sm font-medium transition-all ${
                      isCurrentYear
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/50"
                        : isOutOfRange
                        ? "bg-slate-950 text-gray-500 cursor-default"
                        : "bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white hover:scale-105 active:scale-95"
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
