import db from '../connection';

export interface Category {
  id?: number;
  emoji?: string;
  name: string;
  type: 'income' | 'expense';
}

export const categoryRepository = {
  create: (category: Omit<Category, 'id'>) => {
    const name = category.name?.trim();
    if (!name) {
      throw new Error('Category name is required.');
    }
    if (category.type !== 'income' && category.type !== 'expense') {
      throw new Error("Category type must be 'income' or 'expense'.");
    }
    const result = db.runSync(
      `INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`,
      [category.emoji, name, category.type]
    );
    return result.lastInsertRowId;
  },

  getAll: (): Category[] => {
    const result = db.getAllSync('SELECT * FROM categories');
    return result as Category[];
  },

  getAllSortedByUsage: (): Category[] => {
    const result = db.getAllSync(
      `SELECT c.* FROM categories c
       LEFT JOIN transactions t ON t.categoryId = c.id
       GROUP BY c.id
       ORDER BY COUNT(t.id) DESC, c.name ASC`
    );
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
    values.push(id);
    db.runSync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: (id: number) => {
    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  },
};