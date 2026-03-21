export function currentMonthStr(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthRange(month: string): { startDate: string; endDate: string } {
  const [year, monthStr] = month.split("-");
  const lastDay = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function getYearRange(year: string): { startDate: string; endDate: string } {
  return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

export function formatMonth(month: string): string {
  const [year, monthStr] = month.split("-");
  return new Date(parseInt(year), parseInt(monthStr) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function prevMonth(month: string): string {
  const [year, monthStr] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthStr) - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(month: string): string {
  const [year, monthStr] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthStr), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
