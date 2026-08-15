export interface IEmployee {
  _id: string;
  projectId: string;
  name: string;
  phone?: string;
  role: string;
  dailySalary: number;
  joiningDate: string;
  createdAt: string;
}

/** Employee record enriched with computed payroll figures. */
export interface IEmployeeWithSalary extends IEmployee {
  salary: {
    /** Total earned from attendance (Present -> full day, Half Day -> half, Absent -> 0). */
    totalEarned: number;
    /** Total actually paid out to this employee so far. */
    totalPaid: number;
    /** totalEarned - totalPaid: what is still owed to this worker. */
    pending: number;
  };
}
