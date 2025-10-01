import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText, Database } from 'lucide-react';
import { exportToCSV, exportToJSON, downloadFile } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';

export default function Export() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const debts = useLiveQuery(() => db.debts.toArray()) || [];

  const handleExport = async (type: 'transactions' | 'budgets' | 'debts' | 'all', fileFormat: 'csv' | 'json') => {
    setExporting(true);
    
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      
      if (type === 'all') {
        if (fileFormat === 'json') {
          const allData = {
            exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            transactions,
            budgets,
            debts,
          };
          const content = JSON.stringify(allData, null, 2);
          downloadFile(content, `finance-data-${timestamp}.json`, 'json');
        } else {
          // Export separate CSV files
          if (transactions.length > 0) {
            const csv = exportToCSV(transactions, 'transactions');
            downloadFile(csv, `transactions-${timestamp}.csv`, 'csv');
          }
          if (budgets.length > 0) {
            const csv = exportToCSV(budgets, 'budgets');
            downloadFile(csv, `budgets-${timestamp}.csv`, 'csv');
          }
          if (debts.length > 0) {
            const csv = exportToCSV(debts, 'debts');
            downloadFile(csv, `debts-${timestamp}.csv`, 'csv');
          }
        }
      } else {
        const data = type === 'transactions' ? transactions : type === 'budgets' ? budgets : debts;
        
        if (data.length === 0) {
          toast({
            title: 'No data to export',
            description: `You don't have any ${type} to export.`,
            variant: 'destructive',
          });
          return;
        }
        
        if (fileFormat === 'csv') {
          const csv = exportToCSV(data, type);
          downloadFile(csv, `${type}-${timestamp}.csv`, 'csv');
        } else {
          const json = exportToJSON(data, type);
          downloadFile(json, `${type}-${timestamp}.json`, 'json');
        }
      }
      
      toast({
        title: 'Export successful',
        description: 'Your data has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const stats = {
    transactions: transactions.length,
    budgets: budgets.length,
    debts: debts.length,
    total: transactions.length + budgets.length + debts.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Export Data</h2>
        <p className="text-muted-foreground">Download your financial data for backup or analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.budgets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Debts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.debts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Export to CSV</CardTitle>
                <CardDescription>
                  Download your data in CSV format for spreadsheet analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('transactions', 'csv')}
              disabled={exporting || transactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Transactions CSV
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('budgets', 'csv')}
              disabled={exporting || budgets.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Budgets CSV
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('debts', 'csv')}
              disabled={exporting || debts.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Debts CSV
            </Button>
            <Button
              className="w-full"
              onClick={() => handleExport('all', 'csv')}
              disabled={exporting || stats.total === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All as CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Export to JSON</CardTitle>
                <CardDescription>
                  Download your data in JSON format for backup or data migration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('transactions', 'json')}
              disabled={exporting || transactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Transactions JSON
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('budgets', 'json')}
              disabled={exporting || budgets.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Budgets JSON
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('debts', 'json')}
              disabled={exporting || debts.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Debts JSON
            </Button>
            <Button
              className="w-full"
              onClick={() => handleExport('all', 'json')}
              disabled={exporting || stats.total === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All as JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Your Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Privacy First:</strong> All your financial data is stored locally in your browser using IndexedDB. 
            No data is sent to any server unless you explicitly choose to enable cloud sync.
          </p>
          <p>
            <strong>Offline Capable:</strong> This app works completely offline. Your data is always available, 
            even without an internet connection.
          </p>
          <p>
            <strong>Data Ownership:</strong> You own your data. Export it anytime in CSV or JSON format for backup, 
            analysis, or migration to other tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
