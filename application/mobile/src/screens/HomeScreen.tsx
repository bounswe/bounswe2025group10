import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { wasteService, tipService } from '../services/api';
import { BarChart } from 'react-native-chart-kit';

const chartConfig = {
  backgroundGradientFrom: '#eafbe6',
  backgroundGradientTo: '#eafbe6',
  color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

export const HomeScreen: React.FC = () => {
  const { logout, userData } = useAuth();

  const [wasteType, setWasteType] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');

  const [wasteData, setWasteData] = useState<any[]>([]);
  const [loadingWaste, setLoadingWaste] = useState(true);
  const [tips, setTips] = useState<any[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWasteData(), fetchTips()]);
    setRefreshing(false);
  }, []);

  const fetchWasteData = async () => {
    setLoadingWaste(true);
    try {
      const response = await wasteService.getUserWastes();
      setWasteData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWaste(false);
    }
  };

  const fetchTips = async () => {
    setLoadingTips(true);
    try {
      const response = await tipService.getRecentTips();
      setTips(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTips(false);
    }
  };

  useEffect(() => {
    fetchWasteData();
    fetchTips();
  }, []);

  const handleAddWaste = async () => {
    if (!wasteType || !wasteQuantity) return;
    try {
      await wasteService.addUserWaste(
        wasteType.toUpperCase(),
        parseFloat(wasteQuantity)
      );
      setWasteType('');
      setWasteQuantity('');
      fetchWasteData();
    } catch (error: any) {
      let message = 'Unknown error';
      if (error.response?.data) message = JSON.stringify(error.response.data);
      else if (error.message) message = error.message;
      Alert.alert('Error', `Failed to add waste entry.\n${message}`);
    }
  };

  const barLabels = wasteData.map((i) => i.waste_type);
  const barData = wasteData.map((i) => i.total_amount);
  const screenWidth = Dimensions.get('window').width - 32;

  const renderTipItem = ({ item }: { item: any }) => (
    <View style={styles.tipItem}>
      <Text style={styles.tipTitle}>{item.title}</Text>
      <Text style={styles.tipDescription}>{item.description}</Text>
      <View style={styles.tipStatsRow}>
        <Text style={styles.tipStat}>👍 {item.like_count}</Text>
        <Text style={styles.tipStat}>👎 {item.dislike_count}</Text>
      </View>
    </View>
  );

  const renderEmptyTips = () => (
    <Text style={styles.tipText}>No tips available. Be the first to add one!</Text>
  );

  return (
    <View style={styles.container}>
      <View style={{ height: 20 }} />

      {/* --- User Info --- */}
      <View style={styles.userInfoRow}>
        <Text style={styles.username}>
          {userData?.username ? `Hello, ${userData.username}` : 'Loading...'}
        </Text>
      </View>
      <View style={{ height: 20 }} />

      {/* --- Bar Chart --- */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.chartPlaceholder}>
          {loadingWaste ? (
            <Text style={{ color: colors.gray }}>[Loading waste data...]</Text>
          ) : (
            <BarChart
              data={{ labels: barLabels, datasets: [{ data: barData }] }}
              width={screenWidth}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
              style={{ borderRadius: 12 }}
            />
          )}
        </View>
      </View>
      <View style={{ height: 40 }} />

      {/* --- Waste Logging Inputs --- */}
      <View style={styles.logRow}>
        <TextInput
          style={styles.input}
          placeholder="Waste type"
          value={wasteType}
          onChangeText={setWasteType}
        />
        <TextInput
          style={styles.input}
          placeholder="Waste quantity"
          value={wasteQuantity}
          onChangeText={setWasteQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddWaste}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* --- Tips List --- */}
      <Text style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>
        Latest Tips
      </Text>
      <FlatList
        style={{ flex: 1 }}
        data={loadingTips ? [] : tips}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderTipItem}
        ListEmptyComponent={loadingTips ? undefined : renderEmptyTips}
        ListFooterComponent={
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    padding: spacing.md,
    backgroundColor: '#eafbe6',
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  username: {
    ...typography.h2,
    color: colors.primary,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.input,
    flex: 1,
    marginRight: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  tipItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipDescription: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  tipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  tipStat: {
    ...typography.body,
    color: colors.gray,
    marginLeft: spacing.sm,
  },
  tipText: {
    color: colors.gray,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  logoutButton: {
    backgroundColor: colors.error,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
