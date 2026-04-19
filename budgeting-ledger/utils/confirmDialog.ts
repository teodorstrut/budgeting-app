import { Alert } from 'react-native';

export const confirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = 'Delete',
) => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
};
