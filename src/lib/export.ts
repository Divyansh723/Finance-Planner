import { Transaction, Budget, Debt } from './db';
import { format } from 'date-fns';

export const exportToCSV = (data: Transaction[] | Budget[] | Debt[], type: 'transactions' | 'budgets' | 'debts') => {
  let csv = '';
  
  if (type === 'transactions' && data.length > 0) {
    csv = 'Date,Amount,Type,Category,Description,Tags\n';
    (data as Transaction[]).forEach(t => {
      csv += `${t.date},${t.amount},${t.type},${t.category},"${t.description}","${t.tags.join(';')}"\n`;
    });
  } else if (type === 'budgets' && data.length > 0) {
    csv = 'Month,Category,Amount\n';
    (data as Budget[]).forEach(b => {
      csv += `${b.month},${b.category},${b.amount}\n`;
    });
  } else if (type === 'debts' && data.length > 0) {
    csv = 'Name,Principal,Interest Rate,Minimum Payment,Current Balance\n';
    (data as Debt[]).forEach(d => {
      csv += `"${d.name}",${d.principal},${d.interestRate},${d.minimumPayment},${d.currentBalance}\n`;
    });
  }
  
  return csv;
};

export const exportToJSON = (data: any[], type: string) => {
  return JSON.stringify({
    type,
    exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    data
  }, null, 2);
};

export const downloadFile = (content: string, filename: string, type: 'csv' | 'json') => {
  const mimeType = type === 'csv' ? 'text/csv' : 'application/json';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
