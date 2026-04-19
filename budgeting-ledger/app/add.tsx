import React, { useCallback, useEffect, useState } from 'react';
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
import { TransactionCategorySection } from '../components/ui/TransactionCategorySection';
import { CalculatorKeypad } from '../components/ui/CalculatorKeypad';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';
import { FontAwesome } from '@expo/vector-icons';
import { Header } from '../components/layout/Header';
import { transactionRepository } from '../database/repositories/transactionRepository';
import { confirmDialog } from '../utils/confirmDialog';

export default function AddTransaction() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId ? Number.parseInt(params.editId, 10) : undefined;
  const isEditing = editId != null && !Number.isNaN(editId);

  const [amount, setAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState(categoryRepository.getAll());
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const all = categoryRepository.getAll();
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

      Alert.alert('Saved', 'Transaction updated successfully', [
        { text: 'OK', onPress: () => router.replace('/history') },
      ]);
      return;
    }

    transactionService.addTransaction({
      amount: parsedAmount,
      type,
      categoryId: categoryId ?? undefined,
      note: note.trim(),
      date: new Date(date).toISOString(),
    });

    Alert.alert('Saved', 'Transaction added successfully', [{ text: 'OK', onPress: () => router.push('/') }]);
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
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
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Amount</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={[styles.input, styles.amountInput, { color: theme.colors.onSurfaceVariant, borderColor: theme.colors.outlineVariant }]}
              value={amount}
              keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
              onChangeText={(text) => {
                const normalized = text.replace(/[^0-9.]/g, '');
                const parts = normalized.split('.');
                const clean = parts.length > 2 ? `${parts[0]}.${parts[1]}` : normalized;
                setAmount(clean);
              }}
              placeholder="0.00"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            <TouchableOpacity
              style={[styles.calcButton, { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outlineVariant }]}
              onPress={() => setShowCalculator(true)}
              activeOpacity={0.75}
            >
              <FontAwesome name="calculator" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <CalculatorKeypad
            visible={showCalculator}
            initialValue={amount}
            onConfirm={(val) => { setAmount(val); setShowCalculator(false); }}
            onDismiss={() => setShowCalculator(false)}
          />

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

          <TransactionCategorySection
            categories={categories}
            transactionType={type}
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
            onManageCategories={() =>
              router.push({
                pathname: '/manage-categories',
                params: {
                  from: 'add',
                  type,
                },
              })
            }
          />

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Note</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurfaceVariant, borderColor: theme.colors.outlineVariant }]}
            placeholder="Optional details"
            placeholderTextColor={theme.colors.outline}
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
    </KeyboardAvoidingView>
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  amountInput: {
    flex: 1,
    marginTop: 0,
  },
  calcButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 8,
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
  }
});
