import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { Category, categoryRepository } from '../database/repositories/categoryRepository';
import { transactionService } from '../services/transactionService';
import { CalculatorKeypad } from '../components/ui/CalculatorKeypad';
import { SplitSlider } from '../components/ui/SplitSlider';
import { AppInputLabel } from '../components/ui/AppInputLabel';
import { AppTextInput } from '../components/ui/AppTextInput';
import { Header } from '../components/layout/Header';

type Split = {
  category: Category;
  amount: number;
  percentage: number;
};

export default function BillSplitter() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [totalAmount, setTotalAmount] = useState('');
  const [note, setNote] = useState('');
  const [calculatorVisible, setCalculatorVisible] = useState(true);
  const [calculatorTarget, setCalculatorTarget] = useState<'total' | number>('total');
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const noteRef = useRef<TextInput>(null);
  const [calcHeight, setCalcHeight] = useState(0);

  useEffect(() => {
    if (step === 2) {
      const categories = categoryRepository.getAllSortedByUsage().filter((c) => c.type === 'expense');
      setExpenseCategories(categories);
    }
  }, [step]);

  const total = parseFloat(totalAmount) || 0;
  const allocatedAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const remainingAmount = Math.max(0, total - allocatedAmount);
  const allocatedPct = total > 0 ? Math.round((allocatedAmount / total) * 100) : 0;

  const colorForIndex = (index: number): string => {
    const colors = [
      theme.colors.primary,
      theme.colors.tertiaryContainer,
      theme.colors.secondary,
      theme.colors.primaryContainer,
    ];
    return colors[index % colors.length];
  };

  const availableCategories = useMemo(() => {
    const selectedIds = new Set(splits.map((s) => s.category.id));
    return expenseCategories.filter((category) => !selectedIds.has(category.id));
  }, [expenseCategories, splits]);

  const updateSplitByAmount = (index: number, rawAmount: number) => {
    const clamped = parseFloat(Math.max(0, Math.min(rawAmount, total)).toFixed(2));
    const pct = total > 0 ? parseFloat(((clamped / total) * 100).toFixed(2)) : 0;
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, amount: clamped, percentage: pct } : s))
    );
  };

  const getMaxPercentageForIndex = (index: number): number => {
    if (total <= 0) {
      return 0;
    }

    const currentAmount = splits[index]?.amount ?? 0;
    const otherAmounts = splits.reduce((sum, split, i) => {
      if (i === index) {
        return sum;
      }
      return sum + split.amount;
    }, 0);

    // Keep this stable while dragging and always allow at least the current value.
    const maxAmountForCurrent = Math.max(currentAmount, total - otherAmounts);
    return (maxAmountForCurrent / total) * 100;
  };

  const updateSplitByPercentage = (index: number, pct: number) => {
    const maxPct = getMaxPercentageForIndex(index);
    const safePct = Math.max(0, Math.min(pct, maxPct));
    const amount = (safePct / 100) * total;
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, amount, percentage: parseFloat(safePct.toFixed(2)) } : s))
    );
  };

  const handleCalculatorConfirm = (value: string) => {
    if (calculatorTarget === 'total') {
      setTotalAmount(value);
      setCalculatorVisible(false);
      setTimeout(() => noteRef.current?.focus(), 300);
    } else {
      updateSplitByAmount(calculatorTarget, parseFloat(value) || 0);
      setCalculatorVisible(false);
    }
  };

  const calcInitialValue = (): string => {
    if (calculatorTarget === 'total') return totalAmount;
    const amount = splits[calculatorTarget]?.amount ?? 0;
    return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
  };

  const openCategoryPicker = () => {
    setCategoryPickerVisible(true);
  };

  const addCategorySplit = (category: Category) => {
    const newIndex = splits.length;
    setSplits((prev) => [...prev, { category, amount: 0, percentage: 0 }]);
    setCategoryPickerVisible(false);
    setTimeout(() => {
      setCalculatorTarget(newIndex);
      setCalculatorVisible(true);
    }, 300);
  };

  const removeCategorySplit = (index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalize = () => {
    const tolerance = 0.01;
    if (Math.abs(allocatedAmount - total) > tolerance) {
      Alert.alert(
        'Allocation incomplete',
        `You have $${remainingAmount.toFixed(2)} left unallocated. Please allocate the full amount before finalizing.`,
      );
      return;
    }

    const today = new Date().toISOString();
    splits
      .filter((s) => s.amount > 0)
      .forEach((s) => {
        transactionService.addTransaction({
          amount: parseFloat(s.amount.toFixed(2)),
          type: 'expense',
          categoryId: s.category.id!,
          note: note.trim() || undefined,
          date: today,
        });
      });
    router.replace('/history');
  };

  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === 1 ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: calculatorVisible && calcHeight > 0 ? calcHeight : insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Header
            title="Split Bill"
            showBackButton
            onBackPress={() => router.back()}
            titleColor={theme.colors.primary}
          />

          <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>Total Bill Amount</Text>

          <TouchableOpacity
            style={[styles.amountDisplayPill, { backgroundColor: theme.colors.surfaceContainerHigh }]}
            onPress={() => {
              setCalculatorTarget('total');
              setCalculatorVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.currencySign, { color: theme.colors.primaryContainer }]}>$</Text>
            <Text style={[styles.amountText, { color: onSurface }]}>{totalAmount || '0'}</Text>
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerHigh }]}> 
            <AppInputLabel>Note (optional)</AppInputLabel>
            <AppTextInput
              ref={noteRef}
              value={note}
              onChangeText={setNote}
              placeholder="What's this bill for?"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: total > 0 ? theme.colors.primary : theme.colors.surfaceContainerHigh },
            ]}
            onPress={() => setStep(2)}
            disabled={total <= 0}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.continueText,
                { color: total > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
              ]}
            >
              Continue →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: calculatorVisible && calcHeight > 0 ? calcHeight : insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Header
            title="Allocate Split"
            showBackButton
            onBackPress={() => setStep(1)}
            titleColor={theme.colors.primary}
          />

          <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow }]}> 
            <View style={styles.allocationHeader}>
              <View>
                <Text style={[styles.allocationTitle, { color: onSurface }]}>Allocation Status</Text>
                <Text style={[styles.allocationSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {allocatedPct}% Assigned
                </Text>
              </View>
              <View style={styles.remainingGroup}>
                <Text style={[styles.remainingAmount, { color: theme.colors.secondary }]}>
                  ${remainingAmount.toFixed(2)}
                </Text>
                <Text style={[styles.remainingLabel, { color: theme.colors.onSurfaceVariant }]}>Remaining</Text>
              </View>
            </View>

            <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceContainerHighest }]}> 
              {splits
                .map((s, idx) => ({ s, idx }))
                .filter(({ s }) => s.amount > 0)
                .map(({ s, idx }) => (
                  <View
                    key={s.category.id}
                    style={[styles.progressSegment, { flex: s.amount, backgroundColor: colorForIndex(idx) }]}
                  />
                ))}
              {remainingAmount > 0.005 && (
                <View
                  style={[
                    styles.progressSegment,
                    { flex: remainingAmount, backgroundColor: theme.colors.surfaceContainerHighest },
                  ]}
                />
              )}
            </View>
          </View>

          {splits.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceContainerLow }]}> 
              <Text style={[styles.emptyTitle, { color: onSurface }]}>No categories added yet</Text>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Tap Assign Leftovers to choose an expense category.</Text>
            </View>
          ) : (
            splits.map((split, index) => (
              <View
                key={split.category.id ?? `${split.category.name}-${index}`}
                style={[styles.categoryCard, { backgroundColor: theme.colors.surfaceContainer }]}
              >
                <View style={styles.categoryCardRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.emojiCircle, { backgroundColor: colorForIndex(index) + '28' }]}>
                      <Text style={styles.emojiText}>{split.category.emoji ?? '💰'}</Text>
                    </View>
                    <View>
                      <Text style={[styles.categoryName, { color: onSurface }]}>{split.category.name}</Text>
                      <Text style={[styles.categoryPct, { color: theme.colors.onSurfaceVariant }]}>
                        {split.percentage.toFixed(0)}% of total
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRightActions}>
                    <TouchableOpacity
                      style={[styles.amountPill, { backgroundColor: theme.colors.surfaceContainerHigh }]}
                      onPress={() => {
                        setCalculatorTarget(index);
                        setCalculatorVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.amountPillText, { color: theme.colors.primary }]}>
                        ${split.amount.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.removePill, { backgroundColor: theme.colors.surfaceContainerHigh }]}
                      onPress={() => removeCategorySplit(index)}
                      activeOpacity={0.8}
                    >
                      <FontAwesome name="times" size={12} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                </View>

                <SplitSlider
                  percentage={split.percentage}
                  maximumValue={getMaxPercentageForIndex(index)}
                  trackColor={colorForIndex(index)}
                  surfaceColor={theme.colors.surfaceContainerHighest}
                  onValueChange={(v: number) => updateSplitByPercentage(index, v)}
                />
              </View>
            ))
          )}

          <TouchableOpacity
            style={[
              styles.leftoverButton,
              {
                borderColor: theme.colors.outlineVariant,
                opacity: availableCategories.length === 0 ? 0.4 : 1,
              },
            ]}
            onPress={openCategoryPicker}
            disabled={availableCategories.length === 0}
            activeOpacity={0.75}
          >
            <View style={[styles.leftoverIconCircle, { backgroundColor: theme.colors.surfaceContainerHigh }]}> 
              <FontAwesome name="plus" size={14} color={theme.colors.onSurfaceVariant} />
            </View>
            <View>
              <Text style={[styles.leftoverTitle, { color: onSurface }]}>Assign Leftovers</Text>
              <Text style={[styles.leftoverSubtitle, { color: theme.colors.onSurfaceVariant }]}> 
                {availableCategories.length > 0
                  ? 'Pick an expense category to allocate'
                  : 'All expense categories are already added'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.finalizeButton,
              { backgroundColor: allocatedAmount > 0 ? theme.colors.primary : theme.colors.surfaceContainerHigh },
            ]}
            onPress={handleFinalize}
            disabled={allocatedAmount <= 0}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.finalizeText,
                { color: allocatedAmount > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
              ]}
            >
              Finalize Split
            </Text>
            <FontAwesome
              name="check-circle"
              size={20}
              color={allocatedAmount > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setCategoryPickerVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceContainerLow }]}> 
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: onSurface }]}>Pick Expense Category</Text>
              <TouchableOpacity onPress={() => setCategoryPickerVisible(false)}>
                <FontAwesome name="times" size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.categoryChipGrid}>
              {availableCategories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat.id ?? `${cat.name}-${idx}`}
                  style={[styles.categoryChip, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainer }]}
                  onPress={() => addCategorySplit(cat)}
                >
                  <Text style={[styles.categoryChipText, { color: onSurface }]}>
                    {cat.emoji ? `${cat.emoji} ` : ''}
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
      <CalculatorKeypad
        visible={calculatorVisible}
        initialValue={calcInitialValue()}
        onHeightChange={setCalcHeight}
        onConfirm={handleCalculatorConfirm}
        onDismiss={() => setCalculatorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
  amountDisplayPill: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currencySign: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: 4,
  },
  amountText: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  continueButton: {
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  allocationTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  allocationSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  remainingGroup: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressSegment: {
    height: '100%',
  },
  emptyState: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 4,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  categoryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryPct: {
    fontSize: 12,
    marginTop: 2,
  },
  amountPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  amountPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  removePill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 28,
    marginTop: 2,
  },
  leftoverButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  leftoverIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftoverTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  leftoverSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  finalizeButton: {
    borderRadius: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  finalizeText: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  categoryChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
