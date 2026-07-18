export const isValidTransactionType = (type: string): type is 'income' | 'expense' =>
  type === 'income' || type === 'expense';
