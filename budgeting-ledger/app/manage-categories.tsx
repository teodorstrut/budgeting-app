import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Header } from '../components/layout/Header';
import { useTheme } from '../providers/ThemeProvider';
import { categoryRepository, Category } from '../database/repositories/categoryRepository';
import { transactionRepository } from '../database/repositories/transactionRepository';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';
import { confirmDialog } from '../utils/confirmDialog';

type CategoryType = 'income' | 'expense';

const EMPTY_FORM = {
  emoji: '',
  name: '',
  type: 'expense' as CategoryType,
};

export default function ManageCategories() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; type?: CategoryType }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const loadCategories = useCallback(() => {
    setCategories(categoryRepository.getAll());
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const routeType = params.type;
    if (routeType === 'income' || routeType === 'expense') {
      setForm((prev) => ({ ...prev, type: routeType }));
    }
  }, [params.type]);

  const usageByCategoryId = useMemo(() => {
    const map = new Map<number, number>();
    transactionRepository.getAll().forEach((transaction) => {
      if (transaction.categoryId != null) {
        map.set(transaction.categoryId, (map.get(transaction.categoryId) ?? 0) + 1);
      }
    });
    return map;
  }, []);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
      }),
    [categories]
  );

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setEditingCategoryId(null);
  };

  const startEdit = (category: Category) => {
    setEditingCategoryId(category.id ?? null);
    setForm({
      emoji: category.emoji ?? '',
      name: category.name,
      type: category.type,
    });
  };

  const handleSave = () => {
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      Alert.alert('Name required', 'Please enter a category name.');
      return;
    }

    const normalizedEmoji = form.emoji.trim();

    if (editingCategoryId != null) {
      categoryRepository.update(editingCategoryId, {
        emoji: normalizedEmoji || undefined,
        name: normalizedName,
        type: form.type,
      });
      Alert.alert('Saved', 'Category updated successfully.');
    } else {
      categoryRepository.create({
        emoji: normalizedEmoji || undefined,
        name: normalizedName,
        type: form.type,
      });
      Alert.alert('Saved', 'Category added successfully.');
    }

    clearForm();
    loadCategories();
  };

  const handleDelete = (category: Category) => {
    if (category.id == null) {
      return;
    }

    const usageCount = usageByCategoryId.get(category.id) ?? 0;
    if (usageCount > 0) {
      Alert.alert(
        'Category in use',
        `${category.name} is currently used by ${usageCount} transaction${usageCount === 1 ? '' : 's'}. Reassign those transactions before deleting this category.`
      );
      return;
    }

    confirmDialog('Delete category', `Delete ${category.name}?`, () => {
      categoryRepository.delete(category.id as number);
      if (editingCategoryId === category.id) {
        clearForm();
      }
      loadCategories();
    });
  };

  const isAddFlow = params.from === 'add';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header
          title="Manage Categories"
          showBackButton
          onBackPress={() => router.back()}
        />

        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Category Editor</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>Create, edit, and clean up your categories.</Text>

          <ToggleButtonGroup
            options={[
              { label: 'Expense', value: 'expense' as const },
              { label: 'Income', value: 'income' as const },
            ]}
            selected={form.type}
            onSelect={(value: CategoryType) => setForm((prev) => ({ ...prev, type: value }))}
            activeColor={form.type === 'expense' ? theme.colors.secondary : theme.colors.primary}
            activeTextColor={form.type === 'expense' ? (theme.colors.onSecondary ?? theme.colors.onPrimary) : theme.colors.onPrimary}
            inactiveTextColor={theme.colors.onSurfaceVariant}
            borderColor={theme.colors.outline}
          />

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Emoji</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant }]}
            placeholder="Optional emoji"
            placeholderTextColor={theme.colors.outline}
            value={form.emoji}
            onChangeText={(text) => setForm((prev) => ({ ...prev, emoji: text }))}
          />

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant }]}
            placeholder="Category name"
            placeholderTextColor={theme.colors.outline}
            value={form.name}
            onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>{editingCategoryId != null ? 'Update Category' : 'Add Category'}</Text>
            </TouchableOpacity>

            {editingCategoryId != null && (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.colors.outlineVariant }]}
                onPress={clearForm}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.onSurfaceVariant }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {isAddFlow && (
            <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>When you go back, your new categories will be available in Add Transaction.</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>All Categories</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>You can only delete categories that are not linked to transactions.</Text>

          {sortedCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No categories yet.</Text>
          ) : (
            sortedCategories.map((category) => {
              const usageCount = category.id != null ? usageByCategoryId.get(category.id) ?? 0 : 0;
              return (
                <View
                  key={category.id != null ? category.id.toString() : `${category.type}-${category.name}`}
                  style={[styles.categoryRow, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerHigh }]}
                >
                  <View style={styles.categoryMainInfo}>
                    <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                      {category.emoji ? `${category.emoji} ` : ''}
                      {category.name}
                    </Text>
                    <Text style={[styles.categoryMeta, { color: theme.colors.onSurfaceVariant }]}>
                      {category.type.toUpperCase()} • {usageCount} linked transaction{usageCount === 1 ? '' : 's'}
                    </Text>
                  </View>

                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => startEdit(category)}>
                      <FontAwesome name="pencil" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(category)}>
                      <FontAwesome name="trash" size={16} color={theme.colors.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  categoryRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryMainInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
