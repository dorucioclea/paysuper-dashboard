import {
  getTime,
  getDaysInMonth,
  getDaysInYear,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';

export function timeShiftByPeriod(period) {
  const hour = 3600000;
  const day = hour * 24;
  const threeDays = day * 3;
  const week = day * 7;
  const month = day * 30;

  return {
    // One hour
    current_day: hour * 6,
    previous_day: hour * 6,
    // 8 hours
    current_week: day,
    previous_week: day,
    // One day
    current_month: threeDays,
    previous_month: threeDays,
    // three days
    current_quarter: week,
    previous_quarter: week,
    // half of month
    current_year: month,
    previous_year: month,
  }[period];
}

export function timePeriod(period) {
  const now = getTime(new Date());
  const day = 86400000;
  const week = day * 7;
  const month = day * getDaysInMonth(now);
  const quarter = day * 91;
  const year = day * getDaysInYear(now);

  return {
    current_day: [getTime(startOfDay(now)), now],
    previous_day: [getTime(startOfDay(now - day)), getTime(endOfDay(now - day))],
    current_week: [getTime(startOfWeek(now)), now],
    previous_week: [getTime(startOfWeek(now - week)), getTime(endOfWeek(now - week))],
    current_month: [getTime(startOfMonth(now)), now],
    previous_month: [getTime(startOfMonth(now - month)), getTime(endOfMonth(now - month))],
    current_quarter: [getTime(startOfQuarter(now)), now],
    previous_quarter: [
      getTime(startOfQuarter(now - quarter)),
      getTime(endOfQuarter(now - quarter)),
    ],
    current_year: [getTime(startOfYear(now)), now],
    previous_year: [getTime(startOfYear(now - year)), getTime(endOfYear(now - year))],
  }[period];
}
