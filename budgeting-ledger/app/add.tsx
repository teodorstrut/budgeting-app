import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../providers/ThemeProvider';
import { transactionService } from '../services/transactionService';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { TransactionDateTimeField } from '../components/ui/TransactionDateTimeField';
import { CalculatorKeypad } from '../components/ui/CalculatorKeypad';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';
import { FontAwesome } from '@expo/vector-icons';
import { Header } from '../components/layout/Header';
import { CategoryPickerModal } from '../components/ui/CategoryPickerModal';
import { AppInputLabel } from '../components/ui/AppInputLabel';
import { AppTextInput } from '../components/ui/AppTextInput';
import { AppSelectorField } from '../components/ui/AppSelectorField';
import { transactionRepository } from '../database/repositories/transactionRepository';
import { confirmDialog } from '../utils/confirmDialog';

export default function AddTransaction() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId ? Number.parseInt(params.editId, 10) : undefined;
  const isEditing = editId != null && !Number.isNaN(editId);

  const noteRef = useRef<TextInput>(null);

  const [calcHeight, setCalcHeight] = useState(0);
  const [amount, setAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(true);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState(categoryRepository.getAllSortedByUsage());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setShowCalculator(false);
    }
  }, [isEditing]);

  useFocusEffect(
    useCallback(() => {
      const all = categoryRepository.getAllSortedByUsage();
      setCategories(all);
    }, [])
  );

  useEffect(() => {
    if (!isEditing || editId == null) {
      return;
    }

    const existing = transactionRepository.getById(editId);
    if (!existing) {
      Alert.alert('Not found', 'This transaction no longer exists.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    setAmount(existing.amount.toString());
    setType(existing.type);
    setNote(existing.note ?? '');
    setCategoryId(existing.categoryId ?? null);

    const parsedDate = new Date(existing.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      setDate(parsedDate);
    }
  }, [editId, isEditing, router]);

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.type === type),
    [categories, type]
  );

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === categoryId) ?? null,
    [categories, categoryId]
  );

  useEffect(() => {
    setCategoryId((prev) => {
      if (prev != null && categories.some((cat) => cat.id === prev && cat.type === type)) {
        return prev;
      }
      return categories.find((cat) => cat.type === type)?.id ?? null;
    });
  }, [type, categories]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (isEditing && editId != null) {
      transactionService.updateTransaction(editId, {
        amount: parsedAmount,
        type,
        categoryId: categoryId ?? undefined,
        note: note.trim(),
        date: new Date(date).toISOString(),
      });

      router.replace('/history');
      return;
    }

    transactionService.addTransaction({
      amount: parsedAmount,
      type,
      categoryId: categoryId ?? undefined,
      note: note.trim(),
      date: new Date(date).toISOString(),
    });

    router.push('/');
  };

  const handleDelete = () => {
    if (editId == null) {
      return;
    }
    confirmDialog(
      'Delete transaction',
      'This cannot be undone. Are you sure?',
      () => {
        transactionService.deleteTransaction(editId);
        router.replace('/history');
      },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: showCalculator && calcHeight > 0 ? calcHeight : Math.max(insets.bottom + 16, 32) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
          titleColor={theme.colors.primary}
          showBackButton
          onBackPress={() => router.back()}
          rightIconName="history"
          onRightPress={() => { }}
          containerStyle={styles.addHeaderSpacing}
        />

        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
          <AppInputLabel>Amount</AppInputLabel>
          <AppSelectorField onPress={() => setShowCalculator(true)}>
            <Text style={[styles.amountDisplayText, { color: amount ? theme.colors.onSurface ?? theme.colors.onSurfaceVariant : theme.colors.outline }]}>
              {amount ? `$${amount}` : '$0.00'}
            </Text>
            <FontAwesome name="calculator" size={16} color={theme.colors.primary} />
          </AppSelectorField>

          <ToggleButtonGroup
            options={[
              { label: 'Expense', value: 'expense' as const },
              { label: 'Income', value: 'income' as const },
            ]}
            selected={type}
            onSelect={setType}
            activeColor={type === 'expense' ? theme.colors.secondary : theme.colors.primary}
            activeTextColor={theme.colors.onPrimary}
            inactiveTextColor={theme.colors.onSurfaceVariant}
            borderColor={theme.colors.outline}
          />

          <AppInputLabel>Category</AppInputLabel>
          <AppSelectorField onPress={() => setCategoryPickerVisible(true)}>
            {selectedCategory ? (
              <Text style={[styles.categorySelectorText, { color: theme.colors.onSurface ?? theme.colors.onSurfaceVariant }]}>
                {selectedCategory.emoji ? `${selectedCategory.emoji} ` : ''}{selectedCategory.name}
              </Text>
            ) : (
              <Text style={[styles.categorySelectorPlaceholder, { color: theme.colors.outline }]}>Select category…</Text>
            )}
            <FontAwesome name="chevron-up" size={12} color={theme.colors.onSurfaceVariant} />
          </AppSelectorField>

          <AppInputLabel>Note</AppInputLabel>
          <AppTextInput
            ref={noteRef}
            placeholder="Optional details"
            value={note}
            onChangeText={setNote}
          />

          <TransactionDateTimeField value={date} onChange={setDate} />
        </View>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surfaceContainerHigh,
              borderColor: theme.colors.outlineVariant,
              marginBottom: insets.bottom,
            },
          ]}
        >
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>
              {isEditing ? 'Update Transaction' : 'Save Transaction'}
            </Text>
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.colors.secondary }]}
              onPress={handleDelete}
            >
              <FontAwesome name="trash" size={14} color={theme.colors.secondary} style={{ padding: 12 }} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <CategoryPickerModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        categories={filteredCategories}
        selectedCategoryId={categoryId}
        selectedColor={type === 'expense' ? theme.colors.secondary : theme.colors.primary}
        onSelectCategory={(cat) => {
          setCategoryId(cat.id ?? null);
          setCategoryPickerVisible(false);
          setTimeout(() => noteRef.current?.focus(), 300);
        }}
        emptyMessage="No categories yet."
        onManageCategories={() => {
          setCategoryPickerVisible(false);
          router.push({ pathname: '/manage-categories', params: { from: 'add', type } });
        }}
      />
    </KeyboardAvoidingView>
      <CalculatorKeypad
        visible={showCalculator}
        initialValue={amount}
        onHeightChange={setCalcHeight}
        onConfirm={(val) => {
          setAmount(val);
          setShowCalculator(false);
          if (!isEditing) {
            setCategoryPickerVisible(true);
          }
        }}
        onDismiss={() => setShowCalculator(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
  },
  addHeaderSpacing: {
    marginBottom: 18,
  },
  card: {
    borderRadius: 24,
    padding: 16,
  },
  amountDisplayText: {
    fontSize: 22,
    fontWeight: '700',
  },
  footer: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButton: {
    flexGrow: 1,
    borderRadius: 24,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  deleteButton: {
    borderRadius: 24,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  categorySelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categorySelectorPlaceholder: {
    fontSize: 14,
    fontWeight: '400',
  },
});
