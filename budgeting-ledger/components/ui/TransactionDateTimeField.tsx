import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../providers/ThemeProvider';
import { formatTime } from '../../utils/formatting';

interface TransactionDateTimeFieldProps {
  value: Date;
  onChange: (nextDate: Date) => void;
}

export const TransactionDateTimeField: React.FC<TransactionDateTimeFieldProps> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const openDateTimePicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowDateTimePicker(true);
  };

  const onDateTimeValueChange = (_event: unknown, selected?: Date) => {
    if (!selected) {
      setShowDateTimePicker(false);
      return;
    }

    if (pickerMode === 'date') {
      const merged = new Date(value);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onChange(merged);
    } else {
      const merged = new Date(value);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(merged);
    }

    setShowDateTimePicker(false);
  };

  return (
    <>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Date & Time</Text>
      <View style={[styles.input, styles.dateTimeRow, { borderColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity
          style={[styles.dateTimeSegment, { borderRightColor: theme.colors.outlineVariant }]}
          onPress={() => openDateTimePicker('date')}
        >
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{value.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateTimeSegment}
          onPress={() => openDateTimePicker('time')}
        >
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{formatTime(value)}</Text>
        </TouchableOpacity>
      </View>

      {showDateTimePicker && (
        <DateTimePicker
          value={value}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'default' : pickerMode === 'date' ? 'calendar' : 'clock'}
          onChange={onDateTimeValueChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  dateTimeSegment: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
});
