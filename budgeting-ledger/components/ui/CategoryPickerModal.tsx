import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
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
}) => {
  const { theme } = useTheme();
  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;
  const accentColor = selectedColor ?? theme.colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceContainerLow }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: onSurface }]}>{title}</Text>
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  categoryChip: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  manageCategoriesButton: { marginTop: 16, borderTopWidth: 1, paddingTop: 16, alignItems: 'center' },
  manageCategoriesText: { fontSize: 14, fontWeight: '600' },
});
