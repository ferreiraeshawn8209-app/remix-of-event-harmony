export interface MonthlyInstallment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  description: string;
}

export interface MonthlyPlan {
  installments: MonthlyInstallment[];
}

/**
 * Split a total across evenly-spaced monthly installments between `startDate`
 * and `eventDate`. Falls back to a single installment if the range is invalid.
 */
export function generateEventDayMonthlyPlan(
  total: number,
  startDate: Date,
  eventDate: Date,
  label = "Installment",
): MonthlyPlan {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const start = new Date(startDate);
  const end = new Date(eventDate);
  const monthsBetween =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const count = Math.max(1, monthsBetween);
  const per = Math.round((safeTotal / count) * 100) / 100;

  const installments: MonthlyInstallment[] = [];
  for (let i = 0; i < count; i += 1) {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    const isLast = i === count - 1;
    const amount = isLast
      ? Math.round((safeTotal - per * (count - 1)) * 100) / 100
      : per;
    installments.push({
      installmentNumber: i + 1,
      dueDate: due,
      amount,
      description: `${label} ${i + 1} of ${count}`,
    });
  }

  return { installments };
}
