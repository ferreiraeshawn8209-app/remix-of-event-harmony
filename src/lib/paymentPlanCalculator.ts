/**
 * Payment Plan Calculator
 * Splits quote totals into monthly installments with flexible options
 */

export interface PaymentInstallment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  description: string;
}

export interface PaymentPlan {
  planName: string;
  totalAmount: number;
  numberOfPayments: number;
  installments: PaymentInstallment[];
  monthsAvailable: number;
  isDoublePaymentRequired: boolean;
}

function normalizeDateOnly(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addMonthClamped(baseDate: Date, dayOfMonth: number): Date {
  const next = new Date(baseDate);
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  const lastDay = getLastDayOfMonth(next).getDate();
  next.setDate(Math.min(dayOfMonth, lastDay));
  return normalizeDateOnly(next);
}

/**
 * Calculate months between today and event date
 */
export function calculateMonthsBetween(eventDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  if (target <= today) return 1;
  
  let months = 0;
  const current = new Date(today);
  
  while (current < target) {
    current.setMonth(current.getMonth() + 1);
    months++;
  }
  
  return Math.max(1, months);
}

/**
 * Get the last day of a month
 */
function getLastDayOfMonth(date: Date): Date {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return lastDay;
}

/**
 * Generate monthly payment installments
 */
export function generateMonthlyPlan(
  totalAmount: number,
  eventDate: Date,
  planName: string = "Monthly Installments"
): PaymentPlan {
  const monthsAvailable = calculateMonthsBetween(eventDate);
  const baseAmount = totalAmount / monthsAvailable;
  
  const installments: PaymentInstallment[] = [];
  const today = new Date();
  const lastDueDate = new Date(eventDate);
  lastDueDate.setHours(0, 0, 0, 0);
  lastDueDate.setDate(lastDueDate.getDate() - 1);
  if (lastDueDate <= today) {
    lastDueDate.setTime(today.getTime());
  }

  for (let i = 0; i < monthsAvailable; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    dueDate.setDate(1); // First of each month
    if (dueDate > lastDueDate) {
      dueDate.setTime(lastDueDate.getTime());
    }
    
    // Last payment gets remainder to avoid rounding issues
    const amount = i === monthsAvailable - 1 
      ? totalAmount - (baseAmount * (monthsAvailable - 1))
      : baseAmount;
    
    installments.push({
      installmentNumber: i + 1,
      dueDate,
      amount: Math.round(amount * 100) / 100,
      description: dueDate.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
    });
  }
  
  return {
    planName,
    totalAmount: Math.round(totalAmount * 100) / 100,
    numberOfPayments: monthsAvailable,
    installments,
    monthsAvailable,
    isDoublePaymentRequired: false,
  };
}

/**
 * Generate installments from first payment date through final payment on event day.
 */
export function generateEventDayMonthlyPlan(
  totalAmount: number,
  firstPaymentDate: Date,
  eventDate: Date,
  planName: string = "Monthly Installments to Event Day",
): PaymentPlan {
  const start = normalizeDateOnly(firstPaymentDate);
  const eventDay = normalizeDateOnly(eventDate);
  const dueDates: Date[] = [];

  if (eventDay <= start) {
    dueDates.push(eventDay);
  } else {
    dueDates.push(start);
    let cursor = new Date(start);
    const anchorDay = start.getDate();
    while (true) {
      const nextMonthlyDate = addMonthClamped(cursor, anchorDay);
      if (nextMonthlyDate >= eventDay) break;
      dueDates.push(nextMonthlyDate);
      cursor = nextMonthlyDate;
    }
    dueDates.push(eventDay);
  }

  const installmentCount = Math.max(1, dueDates.length);
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installmentCount);

  const installments: PaymentInstallment[] = dueDates.map((dueDate, index) => {
    const amountCents = index === installmentCount - 1
      ? totalCents - baseCents * (installmentCount - 1)
      : baseCents;
    const isFirst = index === 0;
    const isFinal = index === installmentCount - 1;
    const description = isFinal
      ? `Final payment due on event day (${dueDate.toLocaleDateString("en-ZA")})`
      : isFirst
        ? `First payment (${dueDate.toLocaleDateString("en-ZA")})`
        : dueDate.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

    return {
      installmentNumber: index + 1,
      dueDate,
      amount: amountCents / 100,
      description,
    };
  });

  return {
    planName,
    totalAmount: Math.round(totalAmount * 100) / 100,
    numberOfPayments: installmentCount,
    installments,
    monthsAvailable: installmentCount,
    isDoublePaymentRequired: false,
  };
}

/**
 * Generate a plan with double final payment when needed
 * E.g., 7 payments needed in 6 months = 6 regular + 1 double
 */
export function generateFlexiblePlan(
  totalAmount: number,
  eventDate: Date,
  desiredPayments: number
): PaymentPlan {
  const monthsAvailable = calculateMonthsBetween(eventDate);
  
  if (desiredPayments <= monthsAvailable) {
    // Can spread evenly across available months
    return generateMonthlyPlan(totalAmount, eventDate, `${desiredPayments}-Payment Plan`);
  }
  
  // More payments than months: spread with one double payment
  const baseAmount = totalAmount / desiredPayments;
  const installments: PaymentInstallment[] = [];
  const today = new Date();
  
  // Calculate which installment gets the double payment
  // Typically the last one
  const regularPayments = desiredPayments - 1;
  const doublePaymentIndex = regularPayments;
  
  for (let i = 0; i < desiredPayments; i++) {
    const monthOffset = Math.floor((i / desiredPayments) * monthsAvailable);
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + monthOffset + 1);
    dueDate.setDate(1);
    
    const isDoublePayment = i === doublePaymentIndex;
    const amount = isDoublePayment 
      ? totalAmount - (baseAmount * regularPayments)
      : baseAmount;
    
    installments.push({
      installmentNumber: i + 1,
      dueDate,
      amount: Math.round(amount * 100) / 100,
      description: isDoublePayment
        ? `${dueDate.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })} (Double Payment)`
        : dueDate.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
    });
  }
  
  return {
    planName: `${desiredPayments}-Payment Plan (${monthsAvailable} months)`,
    totalAmount: Math.round(totalAmount * 100) / 100,
    numberOfPayments: desiredPayments,
    installments,
    monthsAvailable,
    isDoublePaymentRequired: desiredPayments > monthsAvailable,
  };
}

/**
 * Generate multiple plan options for a quote
 */
export function generatePaymentPlanOptions(
  totalAmount: number,
  eventDate: Date
): PaymentPlan[] {
  const monthsAvailable = calculateMonthsBetween(eventDate);
  const options: PaymentPlan[] = [];
  
  // Option 1: Standard monthly (spread evenly)
  if (monthsAvailable >= 1) {
    options.push(generateMonthlyPlan(totalAmount, eventDate, "Monthly Installments"));
  }
  
  // Option 2: If 3+ months available, offer bi-weekly breakdown
  if (monthsAvailable >= 3) {
    options.push(generateFlexiblePlan(totalAmount, eventDate, monthsAvailable * 2));
  }
  
  // Option 3: Custom option with double final payment if applicable
  if (monthsAvailable < 6) {
    options.push(generateFlexiblePlan(totalAmount, eventDate, monthsAvailable + 1));
  }
  
  return options;
}

/**
 * Format payment plan for display
 */
export function formatPaymentPlan(plan: PaymentPlan, currencyFormat: (amount: number) => string): string {
  const lines = [
    `Plan: ${plan.planName}`,
    `Total: ${currencyFormat(plan.totalAmount)} over ${plan.numberOfPayments} payments`,
    `Available months: ${plan.monthsAvailable}`,
  ];
  
  if (plan.isDoublePaymentRequired) {
    lines.push("⚠️ Final payment is doubled to fit desired schedule");
  }
  
  lines.push("\nPayment Schedule:");
  plan.installments.forEach(inst => {
    lines.push(`  ${inst.installmentNumber}. ${inst.description}: ${currencyFormat(inst.amount)}`);
  });
  
  return lines.join("\n");
}
