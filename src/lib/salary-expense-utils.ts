type EmploymentLike = {
  startDate: Date;
  endDate: Date | null;
};

type SalaryLike = {
  amount: number;
  effectiveDate: Date;
};

type StaffLike = {
  id: number;
  currentSalary: number;
  startDate: Date;
  hireStatus: boolean;
  TerminationDate: Date | null;
};

export function isEmploymentOverlappingPeriod(
  employments: EmploymentLike[],
  periodStart: Date,
  periodEnd: Date,
): boolean {
  return employments.some((employment) => {
    return (
      employment.startDate <= periodEnd &&
      (employment.endDate == null || employment.endDate >= periodStart)
    );
  });
}

export function isEmployedInPeriod(
  params: {
    staff: StaffLike;
    employments: EmploymentLike[];
  },
  periodStart: Date,
  periodEnd: Date,
): boolean {
  const { staff, employments } = params;

  if (employments.length > 0) {
    return isEmploymentOverlappingPeriod(employments, periodStart, periodEnd);
  }

  return (
    staff.hireStatus === true &&
    staff.startDate <= periodEnd &&
    (staff.TerminationDate == null || staff.TerminationDate >= periodStart)
  );
}

export function getLatestSalaryAtOrBefore(
  salaries: SalaryLike[],
  periodEnd: Date,
): SalaryLike | null {
  for (const salary of salaries) {
    if (salary.effectiveDate <= periodEnd) {
      return salary;
    }
  }
  return null;
}

export function getSalaryForPeriod(
  params: {
    staff: StaffLike;
    employments: EmploymentLike[];
    salaries: SalaryLike[];
  },
  periodStart: Date,
  periodEnd: Date,
): number | null {
  const { staff, employments, salaries } = params;

  if (!isEmployedInPeriod({ staff, employments }, periodStart, periodEnd)) {
    return null;
  }

  const latestSalary = getLatestSalaryAtOrBefore(salaries, periodEnd);
  if (latestSalary) {
    return latestSalary.amount;
  }

  return staff.currentSalary;
}
