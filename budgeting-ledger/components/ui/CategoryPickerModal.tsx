import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BottomSheetModal } from './BottomSheetModal';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';

import { Category } from '../../database/repositories/categoryRepository';

interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (cat: Category) => void;
  selectedCategoryId?: number | null;
  selectedColor?: string;
  emptyMessage?: string;
  title?: string;
  onManageCategories?: () => void;
  /** When true, renders an "All Categories" chip above the category list. */
  showAllOption?: boolean;
  /** Called when the user taps the "All Categories" chip. */
  onSelectAll?: () => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  onClose,
  categories,
  onSelectCategory,
  selectedCategoryId,
  selectedColor,
  emptyMessage = 'No categories available.',
  title = 'Choose Category',
  onManageCategories,
  showAllOption = false,
  onSelectAll,
}) => {
  const { theme } = useTheme();
  const shared = useSharedStyles();
  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;
  const accentColor = selectedColor ?? theme.colors.primary;

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <View style={shared.modal.sheetHeader}>
        <Text style={shared.modal.sheetTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome name="times" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {categories.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          {emptyMessage}
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.chipGrid} keyboardShouldPersistTaps="handled">
          {showAllOption && (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategoryId == null ? accentColor : theme.colors.surfaceContainerHigh,
                  borderColor:
                    selectedCategoryId == null ? accentColor : theme.colors.outlineVariant,
                },
              ]}
              onPress={() => { onSelectAll?.(); onClose(); }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      selectedCategoryId == null
                        ? theme.colors.onPrimary
                        : onSurface,
                  },
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
          )}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId != null && cat.id === selectedCategoryId;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? accentColor : theme.colors.surfaceContainerHigh,
                    borderColor: isSelected ? accentColor : theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: isSelected ? theme.colors.onPrimary : onSurface }]}>
                  {cat.emoji ? `${cat.emoji} ` : ''}{cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {onManageCategories && (
        <TouchableOpacity
          style={[styles.manageCategoriesButton, { borderColor: theme.colors.outlineVariant }]}
          onPress={onManageCategories}
        >
          <Text style={[styles.manageCategoriesText, { color: theme.colors.primary }]}>
            + Manage Categories
          </Text>
        </TouchableOpacity>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheet: { padding: 24 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  categoryChip: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  manageCategoriesButton: { marginTop: 16, borderTopWidth: 1, paddingTop: 16, alignItems: 'center' },
  manageCategoriesText: { fontSize: 14, fontWeight: '600' },
});
