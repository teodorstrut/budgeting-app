import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { Category, categoryRepository } from '../database/repositories/categoryRepository';
import { budgetService, BudgetEntry } from '../services/budgetService';
import { CalculatorKeypad } from '../components/ui/CalculatorKeypad';
import { CategoryPickerModal } from '../components/ui/CategoryPickerModal';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';

type BudgetRow = BudgetEntry;

const ACCENT_COLORS = ['#4fd1c5', '#ffb866', '#ffa2c5', '#5adace'];
const CONTAINER_BG_COLORS = ['#4fd1c528', '#ffb86628', '#ffa2c528', '#5adace28'];

export default function Budgets() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [allExpenseCategories, setAllExpenseCategories] = useState<Category[]>([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      const existing = budgetService.getBudgetsWithCategories();
      setRows(existing.map((e) => ({ ...e })));
      const allCats = categoryRepository.getAll().filter((c) => c.type === 'expense');
      setAllExpenseCategories(allCats);
    }, [])
  );

  const totalMonthlyBudget = useMemo(
    () => rows.reduce((sum, r) => sum + r.amount, 0),
    [rows]
  );

  const availableCategories = useMemo(() => {
    const usedIds = new Set(rows.map((r) => r.categoryId));
    return allExpenseCategories.filter((c) => !usedIds.has(c.id!));
  }, [allExpenseCategories, rows]);

  const colorForIndex = (i: number) => ACCENT_COLORS[i % ACCENT_COLORS.length];
  const bgForIndex = (i: number) => CONTAINER_BG_COLORS[i % CONTAINER_BG_COLORS.length];

  const handleAddCategory = (cat: Category) => {
    setRows((prev) => [
      ...prev,
      { categoryId: cat.id!, categoryName: cat.name, emoji: cat.emoji ?? '💰', amount: 0 },
    ]);
    setCategoryPickerVisible(false);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const openCalculatorFor = (index: number) => {
    setCalculatorTarget(index);
    setCalculatorVisible(true);
  };

  const handleCalculatorConfirm = (value: string) => {
    const amount = parseFloat(value) || 0;
    setRows((prev) =>
      prev.map((r, i) => (i === calculatorTarget ? { ...r, amount } : r))
    );
    setCalculatorVisible(false);
  };

  const calcInitialValue = (): string => {
    const amount = rows[calculatorTarget]?.amount ?? 0;
    return amount > 0 ? (amount % 1 === 0 ? String(amount) : amount.toFixed(2)) : '';
  };

  const handleSave = () => {
    budgetService.saveBudgets(rows.map((r) => ({ categoryId: r.categoryId, amount: r.amount })));
    Alert.alert('Saved', 'Your budgets have been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;

  const whole = `$${Math.floor(totalMonthlyBudget).toLocaleString()}`;
  const dec = `.${totalMonthlyBudget.toFixed(2).split('.')[1]}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Set Budget"
          titleColor={theme.colors.primary}
        />

        {/* Hero: Monthly Cap */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroLabel, { color: theme.colors.onSurfaceVariant }]}>MONTHLY CAP</Text>
          <View style={styles.heroAmountRow}>
            <Text style={[styles.heroWhole, { color: onSurface }]}>{whole}</Text>
            <Text style={[styles.heroDec, { color: theme.colors.primary }]}>{dec}</Text>
          </View>
          <Text style={[styles.heroSubtext, { color: theme.colors.outline }]}>
            Total distribution across all active categories
          </Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: onSurface }]}>Active Categories</Text>
          <TouchableOpacity
            style={[styles.addNewPill, { backgroundColor: theme.colors.primaryContainer + '22' }]}
            onPress={() => setCategoryPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.addNewText, { color: theme.colors.primary }]}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state */}
        {rows.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[styles.emptyTitle, { color: onSurface }]}>No budgets set yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              Tap "Add New" to set a spending limit for an expense category.
            </Text>
          </View>
        )}

        {/* Category Budget Rows */}
        {rows.map((row, index) => (
          <View
            key={row.categoryId}
            style={[
              styles.categoryCard,
              { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant },
            ]}
          >
            <View style={styles.categoryCardRow}>
              <View style={styles.categoryLeft}>
                <View style={[styles.emojiCircle, { backgroundColor: bgForIndex(index) }]}>
                  <Text style={styles.emojiText}>{row.emoji}</Text>
                </View>
                <Text style={[styles.categoryName, { color: onSurface }]}>{row.categoryName}</Text>
              </View>
              <View style={styles.categoryRight}>
                <TouchableOpacity
                  style={[styles.amountPill, { backgroundColor: theme.colors.surfaceContainerHighest }]}
                  onPress={() => openCalculatorFor(index)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.amountCurrency, { color: colorForIndex(index) }]}>$</Text>
                  <Text style={[styles.amountValue, { color: onSurface }]}>
                    {row.amount > 0
                      ? row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : '0'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: theme.colors.surfaceContainerHighest }]}
                  onPress={() => handleRemoveRow(index)}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="times" size={13} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Fixed Save Button */}
      <View
        style={[
          styles.saveButtonContainer,
          { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 72 },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <FontAwesome name="save" size={18} color={theme.colors.onPrimary} style={styles.saveIcon} />
          <Text style={[styles.saveText, { color: theme.colors.onPrimary }]}>Save Budgets</Text>
        </TouchableOpacity>
      </View>

      <NavBar />

      <CategoryPickerModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        categories={availableCategories}
        onSelectCategory={handleAddCategory}
        emptyMessage="All expense categories already have budgets assigned."
      />

      <CalculatorKeypad
        visible={calculatorVisible}
        initialValue={calcInitialValue()}
        onConfirm={handleCalculatorConfirm}
        onDismiss={() => setCalculatorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },

  heroSection: { alignItems: 'center', paddingVertical: 32 },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'flex-end' },
  heroWhole: { fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  heroDec: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  heroSubtext: { fontSize: 13, textAlign: 'center', marginTop: 8, maxWidth: 200 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  addNewPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
  addNewText: { fontSize: 13, fontWeight: '700' },

  emptyCard: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySubtext: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  categoryCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  categoryCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  emojiCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  categoryName: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, gap: 4 },
  amountCurrency: { fontSize: 12, fontWeight: '700' },
  amountValue: { fontSize: 17, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  deleteButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  saveButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12 },
  saveButton: { borderRadius: 9999, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveIcon: { marginRight: 10 },
  saveText: { fontSize: 17, fontWeight: '700' },
});