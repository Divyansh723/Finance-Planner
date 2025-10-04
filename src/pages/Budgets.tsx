import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Budget } from '@/lib/db';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Card as UICard, CardDescription } from '@/components/ui/card';

export default function Budgets() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const allBudgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const budgets = useMemo(() => {
    if (!startDate && !endDate) {
      return allBudgets.filter(b => b.month === month);
    }
    
    return allBudgets.filter(b => {
      const budgetDate = parseISO(`${b.month}-01`);
      if (startDate && endDate) {
        return isWithinInterval(budgetDate, { start: startDate, end: endDate });
      } else if (startDate) {
        return budgetDate >= startDate;
      } else if (endDate) {
        return budgetDate <= endDate;
      }
      return true;
    });
  }, [allBudgets, startDate, endDate, month]);

  const transactions = useMemo(() => {
    if (!startDate && !endDate) {
      const monthStart = format(startOfMonth(new Date(month)), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date(month)), 'yyyy-MM-dd');
      return allTransactions.filter(t => t.date >= monthStart && t.date <= monthEnd);
    }
    
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
  }, [allTransactions, startDate, endDate, month]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBudget: Budget = {
      month,
      category,
      amount: parseFloat(amount),
      synced: false,
      localId: crypto.randomUUID(),
    };

    await db.budgets.add(newBudget);
    
    toast({
      title: 'Budget created',
      description: `Budget of $${amount} set for ${category}.`,
    });

    setOpen(false);
    setCategory('');
    setAmount('');
  };

  const handleDelete = async (id: number) => {
    await db.budgets.delete(id);
    toast({
      title: 'Budget deleted',
      description: 'The budget has been removed.',
    });
  };

  const getBudgetProgress = (budget: Budget) => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      spent,
      percentage: (spent / budget.amount) * 100,
      remaining: budget.amount - spent,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">Set and track your monthly budgets</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Create Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <UICard>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
          <CardDescription>Select a custom date range or use month filter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <div className="flex items-center gap-4">
            <Label htmlFor="month-filter">Or view by month:</Label>
            <Input
              id="month-filter"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-auto"
              disabled={!!(startDate || endDate)}
            />
          </div>
        </CardContent>
      </UICard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const { spent, percentage, remaining } = getBudgetProgress(budget);
            const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';

            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => budget.id && handleDelete(budget.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-medium">${spent.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={
                        status === 'over' ? '[&>div]:bg-destructive' :
                        status === 'warning' ? '[&>div]:bg-warning' :
                        '[&>div]:bg-success'
                      }
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-medium">${budget.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${
                    remaining >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    <div className="text-sm text-muted-foreground">
                      {remaining >= 0 ? 'Remaining' : 'Over budget'}
                    </div>
                    <div className={`text-2xl font-bold ${
                      remaining >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      ${Math.abs(remaining).toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="text-center py-12 text-muted-foreground">
              No budgets set for this month. Create your first budget to start tracking!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
