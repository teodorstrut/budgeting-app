import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { Header } from '../components/layout/Header';
import { useTheme } from '../providers/ThemeProvider';
import { useSharedStyles } from '../theme/styles';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { categoryRepository, Category } from '../database/repositories/categoryRepository';
import { transactionRepository } from '../database/repositories/transactionRepository';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';
import { AppInputLabel } from '../components/ui/AppInputLabel';
import { AppTextInput } from '../components/ui/AppTextInput';
import { BottomSheetModal } from '../components/ui/BottomSheetModal';
import { confirmDialog } from '../utils/confirmDialog';
import { getCategoryAccentBg } from '../utils/categoryColors';

type CategoryType = 'income' | 'expense';

const EMPTY_MODAL_FORM = { emoji: '', name: '', type: 'expense' as CategoryType };

export default function ManageCategories() {
  const { theme } = useTheme();
  const shared = useSharedStyles();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; type?: CategoryType }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [foreignCategories, setForeignCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<CategoryType>(() =>
    params.type === 'income' || params.type === 'expense' ? params.type : 'expense'
  );

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [modalForm, setModalForm] = useState(EMPTY_MODAL_FORM);

  const loadCategories = useCallback(() => {
    setCategories(categoryRepository.getAll().filter((c) => !c.ownerKey || c.isAdopted === 1));
    setForeignCategories(categoryRepository.getForeignCategories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const usageByCategoryId = useMemo(() => {
    const map = new Map<number, number>();
    transactionRepository.getAll().forEach((transaction) => {
      if (transaction.categoryId != null) {
        map.set(transaction.categoryId, (map.get(transaction.categoryId) ?? 0) + 1);
      }
    });
    return map;
  }, []);

  const filteredCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => c.type === selectedType)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, selectedType]
  );

  const bgForIndex = getCategoryAccentBg;

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = () => {
    setModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingCategoryId(null);
    setModalForm({ emoji: '', name: '', type: selectedType });
    openModal();
  };

  const openEditModal = (category: Category) => {
    setIsEditMode(true);
    setEditingCategoryId(category.id ?? null);
    setModalForm({
      emoji: category.emoji ?? '',
      name: category.name,
      type: category.type,
    });
    openModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCategoryId(null);
  };

  const handleModalSave = () => {
    const normalizedName = modalForm.name.trim();
    if (!normalizedName) {
      Alert.alert('Name required', 'Please enter a category name.');
      return;
    }

    const normalizedEmoji = modalForm.emoji.trim();

    if (isEditMode && editingCategoryId != null) {
      categoryRepository.update(editingCategoryId, {
        emoji: normalizedEmoji || undefined,
        name: normalizedName,
        type: modalForm.type,
      });
    } else {
      categoryRepository.create({
        emoji: normalizedEmoji || undefined,
        name: normalizedName,
        type: selectedType,
      });
    }

    closeModal();
    loadCategories();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (category: Category) => {
    if (category.id == null) return;

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
      loadCategories();
    });
  };

  const handleAdoptCategory = (category: Category) => {
    if (category.id == null) return;
    categoryRepository.adoptCategory(category.id);
    loadCategories();
  };

  const isAddFlow = params.from === 'add';
  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;
  const typeLabel = selectedType === 'expense' ? 'Expense' : 'Income';
  const activeToggleColor = selectedType === 'expense' ? theme.colors.secondary : theme.colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header
          title="Categories"
          showBackButton
          onBackPress={() => router.back()}
        />

        {/* Type Filter Toggle */}
        <ToggleButtonGroup
          options={[
            { label: 'Expense', value: 'expense' as const },
            { label: 'Income', value: 'income' as const },
          ]}
          selected={selectedType}
          onSelect={(value: CategoryType) => setSelectedType(value)}
          activeColor={activeToggleColor}
          activeTextColor={selectedType === 'expense' ? (theme.colors.onSecondary ?? theme.colors.onPrimary) : theme.colors.onPrimary}
          inactiveTextColor={theme.colors.onSurfaceVariant}
          borderColor={theme.colors.outline}
        />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: onSurface }]}>{typeLabel} Categories</Text>
          <TouchableOpacity
            style={[styles.addNewPill, { backgroundColor: activeToggleColor + '22' }]}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Text style={[styles.addNewText, { color: activeToggleColor }]}>+ Add {typeLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <EmptyState
            title={`No ${typeLabel.toLowerCase()} categories`}
            subtitle={`Tap "Add ${typeLabel}" to create your first ${typeLabel.toLowerCase()} category.`}
          />
        )}

        {/* Category Rows */}
        {filteredCategories.map((category, index) => {
          const usageCount = category.id != null ? usageByCategoryId.get(category.id) ?? 0 : 0;
          return (
            <Card key={category.id ?? `${category.type}-${category.name}`} style={styles.categoryCard}>
              <View style={styles.categoryCardRow}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.emojiCircle, { backgroundColor: bgForIndex(index) }]}>
                    <Text style={styles.emojiText}>{category.emoji ?? '🏷️'}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: onSurface }]}>{category.name}</Text>
                    <Text style={[styles.categoryMeta, { color: theme.colors.onSurfaceVariant }]}>
                      {usageCount} linked transaction{usageCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.colors.surfaceContainerHighest }]}
                    onPress={() => openEditModal(category)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome name="pencil" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.colors.surfaceContainerHighest }]}
                    onPress={() => handleDelete(category)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome name="trash" size={14} color={theme.colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}
        {/* Foreign Categories Section */}
        {foreignCategories.filter((c) => c.type === selectedType).length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: onSurface }]}>Shared with You</Text>
            </View>
            {foreignCategories
              .filter((c) => c.type === selectedType)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((category, index) => (
                <Card key={category.id ?? `foreign-${category.name}`} style={[styles.categoryCard, { opacity: 0.75 }]}>
                  <View style={styles.categoryCardRow}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.emojiCircle, { backgroundColor: bgForIndex(index) }]}>
                        <Text style={styles.emojiText}>{category.emoji ?? '🏷️'}</Text>
                      </View>
                      <View style={styles.categoryInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.categoryName, { color: onSurface }]}>{category.name}</Text>
                          <FontAwesome name="user" size={10} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text style={[styles.categoryMeta, { color: theme.colors.onSurfaceVariant }]}>From another user</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: theme.colors.primaryContainer }]}
                      onPress={() => handleAdoptCategory(category)}
                      activeOpacity={0.8}
                    >
                      <FontAwesome name="plus" size={14} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
          </>
        )}
      </ScrollView>

      {/* Add / Edit Sheet */}
      <BottomSheetModal
        visible={modalVisible}
        onClose={closeModal}
        sheetStyle={styles.sheetPadding}
        extraBottomPadding={keyboardHeight}
      >
              {/* Sheet Header */}
              <View style={shared.modal.sheetHeader}>
                <Text style={[shared.modal.sheetTitle, { color: onSurface }]}>
                  {isEditMode ? 'Edit Category' : `New ${typeLabel} Category`}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <FontAwesome name="times" size={18} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* Emoji Field */}
              <AppInputLabel>Emoji</AppInputLabel>
              <AppTextInput
                placeholder="e.g. 🛒"
                value={modalForm.emoji}
                onChangeText={(text) => setModalForm((prev) => ({ ...prev, emoji: text }))}
                maxLength={8}
              />
              <Text style={[styles.emojiHint, { color: theme.colors.onSurfaceVariant }]}>
                {"Tip: use your keyboard's emoji key (🌐 or 😊) to insert an emoji"}
              </Text>

              {/* Name Field */}
              <AppInputLabel>Name</AppInputLabel>
              <AppTextInput
                placeholder="Category name"
                value={modalForm.name}
                onChangeText={(text) => setModalForm((prev) => ({ ...prev, name: text }))}
              />

              {/* Add-flow helper */}
              {isAddFlow && !isEditMode && (
                <Text style={[styles.addFlowHint, { color: theme.colors.onSurfaceVariant }]}>
                  When you go back, your new categories will be available in Add Transaction.
                </Text>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[shared.buttons.primary, { flex: 1 }]}
                  onPress={handleModalSave}
                  activeOpacity={0.85}
                >
                  <Text style={shared.buttons.primaryText}>
                    {isEditMode ? 'Update Category' : 'Add Category'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={shared.buttons.secondary}
                  onPress={closeModal}
                  activeOpacity={0.85}
                >
                  <Text style={shared.buttons.secondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  addNewPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
  addNewText: { fontSize: 13, fontWeight: '700' },

  categoryCard: { marginBottom: 12 },
  categoryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 22 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '700' },
  categoryMeta: { fontSize: 12, marginTop: 2 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sheet
  sheetPadding: { padding: 24 },
  emojiHint: { fontSize: 11, marginTop: 4, marginBottom: 12, lineHeight: 16 },
  addFlowHint: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
});
