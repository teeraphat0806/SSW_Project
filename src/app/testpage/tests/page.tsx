"use client";
import {
  useCustomers,
  useStaff,
  useBills,
  useOrders,
  useUsers,
  useExpenses,
  useExpenseCategories,
  useStaffSalaries,
  useStaffIncomes,
  useTypeStaffIncomes,
} from "@/hooks/saleDashboard/useSaleDashboardData";

function Section({
  title,
  loading,
  error,
  children,
}: {
  title: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold">{title}</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && children}
    </div>
  );
}

export default function TestsPage() {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const {
    customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();
  const { staff, loading: staffLoading, error: staffError } = useStaff();
  const { bills, loading: billsLoading, error: billsError } = useBills();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses();
  const {
    expenseCategories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useExpenseCategories();
  const {
    staffSalaries,
    loading: salariesLoading,
    error: salariesError,
  } = useStaffSalaries();
  const {
    staffIncomes,
    loading: incomesLoading,
    error: incomesError,
  } = useStaffIncomes();
  const {
    typeStaffIncomes,
    loading: typeIncomesLoading,
    error: typeIncomesError,
  } = useTypeStaffIncomes();

  return (
    <div className="p-8 pl-[250px]">
      <h1 className="text-3xl font-bold">Hook Test Dashboard</h1>
      <p className="text-gray-600 mt-4">
        Simple page to verify all data hooks load and render.
      </p>

      <Section title="Users" loading={usersLoading} error={usersError}>
        <ul className="mt-4 space-y-2">
          {users.slice(0, 5).map((user) => (
            <li key={user.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{user.name ?? "-"}</h3>
              <p className="text-gray-500">{user.email}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Customers (${customers.length})`}
        loading={customersLoading}
        error={customersError}
      >
        <ul className="mt-4 space-y-2">
          {customers.slice(0, 5).map((c) => (
            <li key={c.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-gray-500">Code: {c.code}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Staff (${staff.length})`}
        loading={staffLoading}
        error={staffError}
      >
        <ul className="mt-4 space-y-2">
          {staff.slice(0, 5).map((s) => (
            <li key={s.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{s.user?.name ?? "-"}</h3>
              <p className="text-gray-500">Position: {s.position}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Bills (${bills.length})`}
        loading={billsLoading}
        error={billsError}
      >
        <ul className="mt-4 space-y-2">
          {bills.slice(0, 5).map((b) => (
            <li key={b.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">Invoice #{b.invoiceNo}</h3>
              <p className="text-gray-500">
                VAT {b.vatRate}% • Total: {b.grandTotal ?? 0}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Orders (${orders.length})`}
        loading={ordersLoading}
        error={ordersError}
      >
        <ul className="mt-4 space-y-2">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">PO {o.poNumber}</h3>
              <p className="text-gray-500">Total: {o.total}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Expenses (${expenses.length})`}
        loading={expensesLoading}
        error={expensesError}
      >
        <ul className="mt-4 space-y-2">
          {expenses.slice(0, 5).map((e) => (
            <li key={e.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{e.description}</h3>
              <p className="text-gray-500">Amount: {e.amount}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Expense Categories (${expenseCategories.length})`}
        loading={categoriesLoading}
        error={categoriesError}
      >
        <ul className="mt-4 space-y-2">
          {expenseCategories.slice(0, 5).map((c) => (
            <li key={c.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-gray-500">{c.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Staff Salaries (${staffSalaries.length})`}
        loading={salariesLoading}
        error={salariesError}
      >
        <ul className="mt-4 space-y-2">
          {staffSalaries.slice(0, 5).map((ss) => (
            <li key={ss.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{ss.amount}</h3>
              <p className="text-gray-500">
                Staff: {ss.Staff?.user?.name ?? ss.Staff?.code ?? "-"}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Staff Incomes (${staffIncomes.length})`}
        loading={incomesLoading}
        error={incomesError}
      >
        <ul className="mt-4 space-y-2">
          {staffIncomes.slice(0, 5).map((si) => (
            <li key={si.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{si.nameIncome}</h3>
              <p className="text-gray-500">
                Amount: {si.amount} • Type: {si.type?.name ?? "-"}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={`Type Staff Incomes (${typeStaffIncomes.length})`}
        loading={typeIncomesLoading}
        error={typeIncomesError}
      >
        <ul className="mt-4 space-y-2">
          {typeStaffIncomes.slice(0, 5).map((ti) => (
            <li key={ti.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{ti.name}</h3>
              <p className="text-gray-500">Types: {ti.types}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
