import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { BottomSheetModal } from './BottomSheetModal';

const PRESET_DAYS = [
  { label: '1st', value: 1 },
  { label: '15th', value: 15 },
  { label: '25th', value: 25 },
];

interface MonthStartDayPickerProps {
  value: number;
  onChange: (day: number) => void;
  theme: any;
  onOpenCustomPicker: () => void;
}

export function MonthStartDayPicker({ value, onChange, theme, onOpenCustomPicker }: MonthStartDayPickerProps) {
  const isPreset = PRESET_DAYS.some(p => p.value === value);
  const currentLabel = PRESET_DAYS.find(p => p.value === value)?.label || `${value}${getOrdinalSuffix(value)}`;

  return (
    <View style={styles.monthCycleContainer}>
      <View style={styles.monthCycleHeader}>
        <Text style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}>Monthly Cycle</Text>
        <Text style={[styles.preferenceSubtitle, { color: theme.colors.onSurfaceVariant }]}>When your budget period begins</Text>
      </View>

      <View style={styles.buttonGroup}>
        {PRESET_DAYS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[
              styles.groupButton,
              value === preset.value && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => onChange(preset.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.groupButtonText,
                {
                  color: value === preset.value ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.groupButton,
            !isPreset && { backgroundColor: theme.colors.primary },
          ]}
          onPress={onOpenCustomPicker}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.groupButtonText,
              {
                color: !isPreset ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {isPreset ? 'Custom' : currentLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CustomDayPickerModalProps {
  visible: boolean;
  currentDay: number;
  onSelect: (day: number) => void;
  onClose: () => void;
  theme: any;
}

export function CustomDayPickerModal({ visible, currentDay, onSelect, onClose, theme }: CustomDayPickerModalProps) {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Select Day</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.modalCloseButton, { color: theme.colors.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={days}
        numColumns={7}
        keyExtractor={(item) => item.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.dayGrid}
        renderItem={({ item: day }) => (
          <TouchableOpacity
            style={[
              styles.dayPickerButton,
              day === currentDay && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => onSelect(day)}
          >
            <Text
              style={[
                styles.dayPickerText,
                {
                  color: day === currentDay ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                  fontWeight: day === currentDay ? '700' : '500',
                },
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        )}
      />
    </BottomSheetModal>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

const styles = StyleSheet.create({
  monthCycleContainer: {
    gap: 12,
  },
  monthCycleHeader: {
    gap: 4,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  preferenceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  groupButton: {
    flex: 1,
    minWidth: '22%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayGrid: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  dayPickerButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff10',
  },
  dayPickerText: {
    fontSize: 14,
  },
});
