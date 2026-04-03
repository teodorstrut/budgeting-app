import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from './ThemeProvider';
import { transactionService } from '../services/transactionService';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { TransactionDateTimeField } from '../components/ui/TransactionDateTimeField';
import { TransactionCategorySection } from '../components/ui/TransactionCategorySection';
import { CalculatorKeypad } from '../components/ui/CalculatorKeypad';
import { FontAwesome } from '@expo/vector-icons';
import { Header } from './Header';

export default function AddTransaction() {
  const { theme } = useTheme();
  const router = useRouter();

  const [amount, setAmount] = useState('');
    const [showCalculator, setShowCalculator] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState(categoryRepository.getAll());
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const all = categoryRepository.getAll();
    setCategories(all);
  }, []);

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

    transactionService.addTransaction({
      amount: parsedAmount,
      type,
      categoryId: categoryId ?? undefined,
      note: note.trim(),
      date: new Date(date).toISOString(),
    });

    Alert.alert('Saved', 'Transaction added successfully', [
      { text: 'OK', onPress: () => router.push('/') },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Header
          title="Add Transaction"
          titleColor={theme.colors.primary}
          showBackButton
          onBackPress={() => router.back()}
          rightIconName="history"
          onRightPress={() => {}}
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

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                {
                  backgroundColor: type === 'expense' ? theme.colors.secondary : 'transparent',
                  borderColor: theme.colors.outline,
                },
              ]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeButtonText, { color: type === 'expense' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                {
                  backgroundColor: type === 'income' ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.outline,
                },
              ]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeButtonText, { color: type === 'income' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>Income</Text>
            </TouchableOpacity>
          </View>

          <TransactionCategorySection
            categories={categories}
            transactionType={type}
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
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
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outlineVariant }]}> 
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>Save Transaction</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
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
    marginTop: 8,
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
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 24,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
