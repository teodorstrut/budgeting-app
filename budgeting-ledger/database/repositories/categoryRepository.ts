import db from '../connection';

export interface Category {
  id?: number;
  emoji?: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  budget?: number;
}

export const categoryRepository = {
  create: (category: Omit<Category, 'id'>) => {
    const result = db.runSync(
      `INSERT INTO categories (emoji, name, type, color, budget) VALUES (?, ?, ?, ?, ?)`,
      [category.emoji, category.name, category.type, category.color, category.budget]
    );
    return result.lastInsertRowId;
  },

  getAll: (): Category[] => {
    const result = db.getAllSync('SELECT * FROM categories');
    return result as Category[];
  },

  getById: (id: number): Category | null => {
    const result = db.getFirstSync('SELECT * FROM categories WHERE id = ?', [id]);
    return result as Category | null;
  },

  update: (id: number, category: Partial<Omit<Category, 'id'>>) => {
    const fields = [];
    const values = [];
    if (category.emoji !== undefined) {
      fields.push('emoji = ?');
      values.push(category.emoji);
    }
    if (category.name !== undefined) {
      fields.push('name = ?');
      values.push(category.name);
    }
    if (category.type !== undefined) {
      fields.push('type = ?');
      values.push(category.type);
    }
    if (category.color !== undefined) {
      fields.push('color = ?');
      values.push(category.color);
    }
    if (category.budget !== undefined) {
      fields.push('budget = ?');
      values.push(category.budget);
    }
    values.push(id);
    db.runSync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: (id: number) => {
    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  },
};