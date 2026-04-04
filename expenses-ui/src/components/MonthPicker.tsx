import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useIsMobile } from "../hooks/use-mobile";

interface MonthPickerProps {
  currentMonth: string; // "YYYY-MM" format
}

export function MonthPicker({ currentMonth }: MonthPickerProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Parse current month
  const [year, month] = currentMonth.split("-");
  const currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const displayDate = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // For the picker, we'll show the current year and allow navigation
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthSelect = (selectedMonth: number) => {
    const newMonth = `${pickerYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    void router.navigate({
      to: "/",
      search: (prev) => ({ ...prev, month: newMonth, view: "monthly" }),
      replace: true,
    });
    setIsOpen(false);
  };

  const handlePreviousYear = () => {
    setPickerYear(pickerYear - 1);
  };

  const handleNextYear = () => {
    setPickerYear(pickerYear + 1);
  };

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${isMobile ? "w-full justify-center py-2.5" : ""}`}
      >
        <Calendar className="w-4 h-4" />
        <span className="font-semibold">{displayDate}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className={`${isMobile ? "fixed inset-x-4 top-1/2 -translate-y-1/2" : "absolute right-0 mt-2"} w-${isMobile ? "auto" : "72"} bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50 p-4`}>
            {/* Year Navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousYear}
                className="p-2 h-8 w-8 hover:bg-blue-600 hover:border-blue-600 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold text-white">{pickerYear}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextYear}
                className="p-2 h-8 w-8 hover:bg-blue-600 hover:border-blue-600 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-2">
              {months.map((monthName, index) => {
                const isCurrentMonth =
                  pickerYear === currentDate.getFullYear() &&
                  index === parseInt(month) - 1;

                return (
                  <button
                    key={monthName}
                    onClick={() => handleMonthSelect(index)}
                    className={`${isMobile ? "py-3" : "py-2"} px-3 rounded-md text-sm font-medium transition-all ${
                      isCurrentMonth
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/50"
                        : "bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white hover:scale-105 active:scale-95"
                    }`}
                  >
                    {monthName.slice(0, 3)}
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

