# Project Maintenance & Profit Manager

A full-stack Next.js application for tracking construction/project expenses,
employee salaries, attendance, client payments, and profit — with a
native-app-style mobile experience.

## Stack
Next.js 16 (App Router) · TypeScript · MongoDB + Mongoose · Tailwind CSS · Recharts

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` file in the project root (see `.env.example`):
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/project_profit_db?retryWrites=true&w=majority
   ```
   You can use a free MongoDB Atlas cluster, or a local MongoDB instance
   (`mongodb://localhost:27017/project_profit_db`).

3. Run the dev server:
   ```
   npm run dev
   ```
   Open http://localhost:3000 — it redirects to `/projects`.

## How money is calculated

All financial math lives in one place: `src/lib/calculations.ts`.
Every API route and page calls `buildProjectSummary()` / `buildEmployeeSalarySummary()`
so the numbers are always consistent.

Several distinct figures are surfaced on purpose — they answer different
questions:

```
Total Expenses = SUM(expenses.amount) for the project
Total Salary   = SUM(attendance.salary) for the project   (earned/accrued, not
                                                             necessarily paid out yet)
Total Spent    = Total Expenses + Total Salary

Profit         = Project Budget - Total Spent          (cost-accounting view —
                                                          assumes the full budget
                                                          will eventually be collected,
                                                          and earned salary counts as
                                                          a real cost whether or not
                                                          it's been paid out yet)
Profit %       = (Profit / Project Budget) * 100

Total Received      = SUM(payments.amount) for the project
Outstanding Balance = Project Budget - Total Received  (what the client still owes)
Collection %         = (Total Received / Project Budget) * 100
Cash Position        = Total Received - Total Spent     (real cash-in-hand view —
                                                           what matters day-to-day,
                                                           especially early in a
                                                           project when collections
                                                           lag spending)

Total Salary Paid = SUM(salaryPayments.amount) for the project
Salary Pending     = Total Salary - Total Salary Paid   (wages earned but not yet
                                                           paid out to workers — a
                                                           payroll liability figure;
                                                           does NOT change Profit or
                                                           Cash Position)
```

Attendance salary itself is derived from status:
`Present -> dailySalary`, `Half Day -> dailySalary / 2`, `Absent -> 0`.
Per-employee, the same earned/paid/pending breakdown is available via
`buildEmployeeSalarySummary()` and shown on each employee's card.

A project's **budget health** badge (On Track / Near Budget / Over Budget) is
driven by `totalSpent / budget`: under 80% is on track, 80–100% is near
budget, over 100% is over budget.

Nothing is cached or hardcoded — every dashboard, card, and chart reads
live from MongoDB on each request.

## Folder structure

```
src/
  app/
    projects/                 # Projects list (dashboard/home) page — includes
                               # a cross-project totals strip (budget/spent/
                               # profit/outstanding/salary-pending across every project)
      [id]/                   # Project detail layout (tabs on desktop,
                               #   fixed bottom tab bar on mobile)
        page.tsx              # Project dashboard + charts (Cost & Budget /
                               #   Payroll / Cash & Collections / Trends)
        expenses/page.tsx     # + CSV export
        payments/page.tsx     # Client payments received + CSV export
        employees/page.tsx    # Earned / Paid / Pending salary per employee
        attendance/page.tsx   # Daily attendance + daily summary
    api/
      projects/route.ts               # GET (list+search+filter+sort), POST
      projects/[id]/route.ts          # GET, PUT, DELETE (cascades expenses,
                                       #   employees, attendance, payments,
                                       #   salary payments)
      projects/[id]/expenses/route.ts # GET, POST
      projects/[id]/payments/route.ts # GET, POST
      projects/[id]/employees/route.ts# GET, POST (enriched with earned/paid/pending)
      projects/[id]/attendance/route.ts # GET (by date or range), POST (upsert)
      projects/[id]/summary/route.ts  # GET — dashboard + chart data
      expenses/[id]/route.ts          # PUT, DELETE
      payments/[id]/route.ts          # PUT, DELETE
      employees/[id]/route.ts         # PUT, DELETE (cascades salary payments)
      employees/[id]/salary-payments/route.ts # GET, POST — payouts to one employee
      salary-payments/[id]/route.ts   # PUT, DELETE
      attendance/[id]/route.ts        # PUT, DELETE
  components/
    projects/  expenses/  payments/  employees/  attendance/  dashboard/  ui/
  lib/
    mongodb.ts        # cached connection
    calculations.ts   # single source of truth for all money math
    csv.ts             # client-side CSV export helper
  models/
    Project.ts  Employee.ts  Expense.ts  Attendance.ts  Payment.ts  SalaryPayment.ts
  types/
    project.ts  employee.ts  expense.ts  attendance.ts  payment.ts  salaryPayment.ts
```

## Mobile — designed to feel like a native app

- **Fixed bottom tab bar** inside a project (Dashboard / Expenses / Payments /
  Employees / Attendance) instead of horizontally-scrolling text tabs —
  desktop keeps the horizontal tab strip.
- **Floating action buttons** for the primary "add" action on Projects,
  Expenses, Payments, and Employees, positioned above the tab bar.
- **Sticky, minimal app header** (no drawer menu — there's one top-level
  destination, so it's just a tappable logo).
- Every data table (Expenses, Payments, Attendance, Daily Summary) renders as
  a stacked card list below the `sm` breakpoint and a full table from `sm`
  up, rather than a horizontally-scrolling table on phones.
- Modal forms stack to a single column on narrow screens; all primary buttons
  are ≥44px tall for touch; `viewport-fit=cover` + `env(safe-area-inset-*)`
  keep content clear of iOS notches/home indicators; `theme-color` and
  `apple-mobile-web-app-capable` are set for a native feel when added to a
  home screen.

## Notes

- Attendance uses a unique compound index (`employeeId + date`) and an
  upsert on POST, so marking the same employee twice on the same day
  updates the existing record instead of creating a duplicate.
- Deleting a project cascades to its expenses, employees, attendance,
  payments, and salary payments (with a confirmation modal that says so).
  Deleting an employee cascades to their attendance and salary payment history.
- All amounts are formatted as INR (₹) via `Intl.NumberFormat`.
- Chart colors follow a validated colorblind-safe categorical palette;
  status colors (on-track/near-budget/over-budget) are fixed and always
  paired with an icon + label, never color alone.

## Suggested next steps (not yet implemented)

- Authentication / multi-user roles (currently single-tenant, no login).
- Budget revision history (editing budget currently overwrites with no audit trail).
- File attachments on expenses (receipts) and employees (ID proof).
- Employees shared across projects instead of scoped to one project.
- PDF export of the project summary for sharing with a client.
- PWA manifest + custom app icons for a true "install to home screen" experience.
