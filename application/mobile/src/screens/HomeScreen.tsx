import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList, Alert, Dimensions } from 'react-native';
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
  const profilePic = null; // Replace with actual image URI if available

  // Reusable fetch function
  const fetchWasteData = async () => {
    setLoadingWaste(true);
    try {
      const response = await wasteService.getUserWastes();
      setWasteData(response.data);
    } catch (error) {
      console.error('Error fetching waste data:', error);
    } finally {
      setLoadingWaste(false);
    }
  };

  const fetchTips = async () => {
    setLoadingTips(true);
    try {
      const response = await tipService.getTips();
      setTips(response.data);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  useEffect(() => {
    fetchWasteData();
    fetchTips();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleAddWaste = async () => {
    if (!wasteType || !wasteQuantity) return;
    const typeToSend = wasteType.toUpperCase();
    const amountToSend = parseFloat(wasteQuantity);
    console.log('Adding waste:', { waste_type: typeToSend, amount: amountToSend });
    try {
      await wasteService.addUserWaste(typeToSend, amountToSend);
      setWasteType('');
      setWasteQuantity('');
      await fetchWasteData();
    } catch (error: any) {
      console.error('Error adding waste:', error);
      let message = 'Unknown error';
      if (error.response && error.response.data) {
        message = JSON.stringify(error.response.data);
      } else if (error.message) {
        message = error.message;
      }
      Alert.alert('Error', `Failed to add waste entry.\n${message}`);
    }
  };

  // Prepare data for BarChart
  const barLabels = wasteData.map((item) => item.waste_type);
  const barData = wasteData.map((item) => item.total_amount);
  const screenWidth = Dimensions.get('window').width - 32; // padding

  return (
    <View style={styles.container}>
      {/* User Info Row */}
      <View style={{ height: 26 }} />
      <View style={styles.userInfoRow}>
        <Text style={styles.username}>{"Hello, " + userData?.username || 'Loading...'}</Text>
      </View>
      <View style={{ height: 26 }} />
      {/* Progress Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.chartPlaceholder}>
          {loadingWaste ? (
            <Text style={{ color: colors.gray }}>[Loading waste data...]</Text>
          ) : (
            <BarChart
              data={{
                labels: barLabels,
                datasets: [
                  {
                    data: barData,
                  },
                ],
              }}
              width={screenWidth}
              height={180}
              yAxisLabel={''}
              yAxisSuffix={''}
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
              style={{ borderRadius: 12 }}
            />
          )}
        </View>
        <View style={{ height: 46 }} />
      </View>

      {/* Waste Logging Inputs */}
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

      {/* Latest Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>Latest Tips</Text>
        {loadingTips ? (
          <Text style={styles.tipText}>Loading tips...</Text>
        ) : (
          <FlatList
            data={tips}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.tipItem}>
                <Text style={styles.tipText}>{item.text}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    padding: spacing.md,
    backgroundColor: '#eafbe6',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    marginRight: spacing.sm,
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
  tipsContainer: {
    marginBottom: spacing.md,
  },
  tipItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipText: {
    color: colors.gray,
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