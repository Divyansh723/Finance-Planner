
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import StatCard from '@/components/StatCard';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Dashboard() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  
  const currentMonth = format(new Date(), 'yyyy-MM');

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const transactions = useMemo(() => {
    if (!startDate && !endDate) return allTransactions;
    
    return allTransactions.filter(t => {
      const transactionDate = parseISO(t.date);
      if (startDate && endDate) {
        return isWithinInterval(transactionDate, { start: startDate, end: endDate });
      } else if (startDate) {
        return transactionDate >= startDate;
      } else if (endDate) {
        return transactionDate <= endDate;
      }
      return true;
    });
  }, [allTransactions, startDate, endDate]);

  const budgets = useLiveQuery(
    () => db.budgets.where('month').equals(currentMonth).toArray()
  ) || [];

  const debts = useLiveQuery(() => db.debts.toArray()) || [];

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = income - expenses;

  const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);

  // Category breakdown for pie chart
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your financial health
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={`$${income.toFixed(2)}`}
          icon={<TrendingUp className="w-full h-full" />}
          variant="success"
          description={`${transactions.filter(t => t.type === 'income').length} transactions`}
        />
        <StatCard
          title="Total Expenses"
          value={`$${expenses.toFixed(2)}`}
          icon={<TrendingDown className="w-full h-full" />}
          variant="destructive"
          description={`${transactions.filter(t => t.type === 'expense').length} transactions`}
        />
        <StatCard
          title="Net Income"
          value={`$${netIncome.toFixed(2)}`}
          icon={<Wallet className="w-full h-full" />}
          variant={netIncome >= 0 ? 'success' : 'destructive'}
          description={netIncome >= 0 ? 'Positive cashflow' : 'Negative cashflow'}
        />
        <StatCard
          title="Total Debt"
          value={`$${totalDebt.toFixed(2)}`}
          icon={<AlertCircle className="w-full h-full" />}
          variant="warning"
          description={`${debts.length} active debts`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="40%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => `${value} (${((entry.payload.value / expenses) * 100).toFixed(0)}%)`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expense data for this month
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {budgets.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {budgets.slice(0, 5).map(budget => {
                    const spent = transactions
                      .filter(t => t.type === 'expense' && t.category === budget.category)
                      .reduce((sum, t) => sum + t.amount, 0);
                    const percentage = (spent / budget.amount) * 100;

                    return (
                      <div key={budget.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{budget.category}</span>
                          <span className="text-muted-foreground">
                            ${spent.toFixed(0)} / ${budget.amount.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              percentage > 100 ? 'bg-destructive' : percentage > 80 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No budgets set for this month
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
