import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  date: string;
  amount: number;
  category: string;
  description: string;
  tags: string[];
  type: 'income' | 'expense';
  debtId?: number;
  synced: boolean;
  localId?: string;
}

export interface Budget {
  id?: number;
  category: string;
  amount: number;
  month: string;
  synced: boolean;
  localId?: string;
}

export interface Debt {
  id?: number;
  name: string;
  principal: number;
  interestRate: number;
  minimumPayment: number;
  currentBalance: number;
  createdDate: string;
  synced: boolean;
  localId?: string;
}

export class FinanceDB extends Dexie {
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  debts!: Table<Debt>;

  constructor() {
    super('FinanceDB');
    this.version(1).stores({
      transactions: '++id, date, category, type, synced',
      budgets: '++id, category, month, synced',
      debts: '++id, name, synced'
    });
    this.version(2).stores({
      transactions: '++id, date, category, type, debtId, synced',
      budgets: '++id, category, month, synced',
      debts: '++id, name, createdDate, synced'
    }).upgrade(async tx => {
      // Add createdDate to existing debts
      const debts = await tx.table('debts').toArray();
      debts.forEach(debt => {
        tx.table('debts').update(debt.id!, { createdDate: new Date().toISOString().split('T')[0] });
      });
    });
  }
}

export const db = new FinanceDB();
