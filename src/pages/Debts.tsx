import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Debt } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Debts() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const { toast } = useToast();

  const debts = useLiveQuery(() => db.debts.toArray()) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDebt: Debt = {
      name,
      principal: parseFloat(principal),
      interestRate: parseFloat(interestRate),
      minimumPayment: parseFloat(minimumPayment),
      currentBalance: parseFloat(currentBalance),
      synced: false,
      localId: crypto.randomUUID(),
    };

    await db.debts.add(newDebt);
    
    toast({
      title: 'Debt added',
      description: `${name} has been added to your debt tracker.`,
    });

    setOpen(false);
    setName('');
    setPrincipal('');
    setInterestRate('');
    setMinimumPayment('');
    setCurrentBalance('');
  };

  const handleDelete = async (id: number) => {
    await db.debts.delete(id);
    toast({
      title: 'Debt deleted',
      description: 'The debt has been removed.',
    });
  };

  const calculatePayoffMonths = (debt: Debt) => {
    if (debt.minimumPayment <= 0 || debt.interestRate < 0) return null;
    
    const monthlyRate = debt.interestRate / 100 / 12;
    const balance = debt.currentBalance;
    const payment = debt.minimumPayment;
    
    if (monthlyRate === 0) {
      return Math.ceil(balance / payment);
    }
    
    const months = Math.ceil(
      -Math.log(1 - (monthlyRate * balance) / payment) / Math.log(1 + monthlyRate)
    );
    
    return isFinite(months) && months > 0 ? months : null;
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalMinimumPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Debts</h2>
          <p className="text-muted-foreground">Track and manage your debts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Debt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Debt Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Credit Card, Student Loan"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Original Amount</Label>
                  <Input
                    id="principal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Minimum Payment</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minimumPayment}
                    onChange={(e) => setMinimumPayment(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Add Debt</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {debts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${totalDebt.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Minimum Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalMinimumPayment.toFixed(2)}/mo
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Debts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {debts.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {debts.length > 0 ? (
          debts.map(debt => {
            const payoffMonths = calculatePayoffMonths(debt);
            const progress = ((debt.principal - debt.currentBalance) / debt.principal) * 100;

            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{debt.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {debt.interestRate.toFixed(2)}% APR
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => debt.id && handleDelete(debt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Original</div>
                      <div className="text-lg font-semibold">${debt.principal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Balance</div>
                      <div className="text-lg font-semibold text-destructive">
                        ${debt.currentBalance.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Min. Payment</div>
                      <div className="text-lg font-semibold">${debt.minimumPayment.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Payoff Time</div>
                      <div className="text-lg font-semibold">
                        {payoffMonths 
                          ? `${payoffMonths} months` 
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}% paid off</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              No debts tracked. Add a debt to start managing your payoff plan!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
