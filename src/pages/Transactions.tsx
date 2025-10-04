import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Transaction } from '@/lib/db';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from '@/components/DateRangePicker';

export default function Transactions() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [debtId, setDebtId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const debts = useLiveQuery(() => db.debts.toArray()) || [];

  const allTransactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray()
  ) || [];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTransaction: Transaction = {
      date,
      amount: parseFloat(amount),
      type,
      category,
      description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      debtId: debtId ? parseInt(debtId) : undefined,
      synced: false,
      localId: crypto.randomUUID(),
    };

    await db.transactions.add(newTransaction);
    
    // If this is a debt payment, update the debt balance
    if (debtId && type === 'expense') {
      const debtIdNum = parseInt(debtId);
      const debt = await db.debts.get(debtIdNum);
      if (debt) {
        await db.debts.update(debtIdNum, {
          currentBalance: Math.max(0, debt.currentBalance - parseFloat(amount))
        });
      }
    }
    
    toast({
      title: 'Transaction added',
      description: debtId 
        ? `Debt payment of $${amount} recorded.` 
        : `${type === 'income' ? 'Income' : 'Expense'} of $${amount} recorded.`,
    });

    setOpen(false);
    setAmount('');
    setCategory('');
    setDescription('');
    setTags('');
    setDebtId('');
  };

  const handleDelete = async (id: number) => {
    const transaction = await db.transactions.get(id);
    
    // If this was a debt payment, restore the debt balance
    if (transaction?.debtId && transaction.type === 'expense') {
      const debt = await db.debts.get(transaction.debtId);
      if (debt) {
        await db.debts.update(transaction.debtId, {
          currentBalance: debt.currentBalance + transaction.amount
        });
      }
    }
    
    await db.transactions.delete(id);
    toast({
      title: 'Transaction deleted',
      description: 'The transaction has been removed.',
    });
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="groceries, essential"
                  />
                </div>
                {type === 'expense' && debts.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="debt">Link to Debt Payment (Optional)</Label>
                    <Select value={debtId} onValueChange={setDebtId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Not a debt payment" />
                      </SelectTrigger>
                      <SelectContent>
                        {debts.map(debt => (
                          <SelectItem key={debt.id} value={debt.id!.toString()}>
                            {debt.name} (${debt.currentBalance.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">Add Transaction</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {transaction.category}
                        {transaction.debtId && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Debt Payment
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        {transaction.description && ` • ${transaction.description}`}
                      </div>
                      {transaction.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {transaction.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => transaction.id && handleDelete(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No transactions yet. Add your first transaction to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
