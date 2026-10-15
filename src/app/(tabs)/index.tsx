import { StyleSheet, Text, View } from 'react-native';

export default function BudgetScreen() {
  return (
    <View style={styles.root}>
      <Text>Бюджет</Text>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
