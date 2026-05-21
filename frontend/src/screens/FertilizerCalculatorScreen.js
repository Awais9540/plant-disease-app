import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCalculatorInputs, saveCalculatorInputs } from '../services/storageService';
import { colors } from '../utils/theme';

const CROP_CATEGORIES = ['Apple', 'Bell_Pepper', 'Corn', 'Grape', 'Potato', 'Tomato'];

const DEFAULT_FORM = {
  cropType: 'Tomato',
  growthStage: 'Flowering',
  plotSize: '1',
  areaUnit: 'acre',
  soilType: 'Sandy',
  fertilizerType: 'Urea',
};

const cropRates = {
  Apple: 45,
  Bell_Pepper: 50,
  Corn: 70,
  Grape: 48,
  Potato: 60,
  Tomato: 55,
};

export default function FertilizerCalculatorScreen() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);

  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [soilModalVisible, setSoilModalVisible] = useState(false);
  const [fertilizerModalVisible, setFertilizerModalVisible] = useState(false);

  useEffect(() => {
    getCalculatorInputs().then((data) => {
      if (data?.fertilizer) setForm(data.fertilizer);
    });
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calculate = async () => {
    const size = Number(form.plotSize);

    if (!size || size <= 0) {
      Alert.alert('Invalid Plot Size', 'Please enter a valid plot size.');
      return;
    }

    let baseRate = cropRates[form.cropType] || 50;

    if (form.areaUnit.toLowerCase() === 'hectare') baseRate *= 2.47;
    if (form.areaUnit.toLowerCase() === 'kanal') baseRate *= 0.125;
    if (form.areaUnit.toLowerCase() === 'marla') baseRate *= 0.00625;

    let total = baseRate * size;

    if (form.growthStage.toLowerCase() === 'flowering') total *= 1.1;
    if (form.growthStage.toLowerCase() === 'fruiting') total *= 1.2;
    if (form.growthStage.toLowerCase() === 'seedling') total *= 0.65;

    if (form.soilType.toLowerCase() === 'sandy') total *= 1.15;
    if (form.soilType.toLowerCase() === 'clay') total *= 0.9;

    const output = {
      fertilizer: form.fertilizerType,
      amount: `${total.toFixed(1)} kg`,
      perArea: `${baseRate.toFixed(1)} kg / ${form.areaUnit}`,
      application: form.growthStage === 'Seedling' ? '1 light split' : '2–3 split applications',
      frequency: form.growthStage === 'Fruiting' ? 'Every 2 weeks' : 'Every 3 weeks',
      coverage: `${form.plotSize} ${form.areaUnit}`,
      note: 'Apply fertilizer near the root zone and irrigate lightly after application.',
    };

    setResult(output);

    const old = await getCalculatorInputs();
    await saveCalculatorInputs({
      ...old,
      fertilizer: form,
    });
  };

  const clearForm = async () => {
    setForm(DEFAULT_FORM);
    setResult(null);

    const old = await getCalculatorInputs();
    await saveCalculatorInputs({
      ...old,
      fertilizer: DEFAULT_FORM,
    });
  };

  const inputField = (label, value, key, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => update(key, text)}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor="#9AB29A"
      />
    </View>
  );

  const dropdownField = (label, value, onPress) => (
    <TouchableOpacity style={styles.inputGroup} onPress={onPress}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optionBox}>
        <Text style={styles.optionText}>{value}</Text>
        <Ionicons name="chevron-down" size={20} color="#6A856A" />
      </View>
    </TouchableOpacity>
  );

  const SelectModal = ({ visible, title, subtitle, options, selectedValue, onSelect, onClose }) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>

          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.cropOption,
                selectedValue === option && styles.cropOptionActive,
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.cropOptionText,
                  selectedValue === option && styles.cropOptionTextActive,
                ]}
              >
                {option}
              </Text>

              {selectedValue === option && (
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="leaf-outline" size={34} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Fertilizer Calculator</Text>
            <Text style={styles.subtitle}>
              Estimate fertilizer amount based on crop, area, soil, and stage.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {dropdownField('Crop Category', form.cropType, () => setCropModalVisible(true))}

          {dropdownField('Growth Stage', form.growthStage, () => setStageModalVisible(true))}

          {inputField('Plot Size', form.plotSize, 'plotSize', 'numeric')}

          {dropdownField('Area Unit', form.areaUnit, () => setUnitModalVisible(true))}

          {dropdownField('Soil Type', form.soilType, () => setSoilModalVisible(true))}

          {dropdownField('Fertilizer Type', form.fertilizerType, () => setFertilizerModalVisible(true))}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearForm}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calculateBtn} onPress={calculate}>
              <Ionicons name="calculator" size={20} color="#fff" />
              <Text style={styles.calculateText}>Calculate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons name="checkmark-circle" size={30} color={colors.primary} />
              </View>

              <View>
                <Text style={styles.resultTitle}>{result.fertilizer}</Text>
                <Text style={styles.resultSubtitle}>Recommended Plan</Text>
              </View>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Recommended Amount</Text>
              <Text style={styles.amountValue}>{result.amount}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Rate</Text>
              <Text style={styles.resultValue}>{result.perArea}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Application</Text>
              <Text style={styles.resultValue}>{result.application}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Frequency</Text>
              <Text style={styles.resultValue}>{result.frequency}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Coverage</Text>
              <Text style={styles.resultValue}>{result.coverage}</Text>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={20} color="#FF8F00" />
              <Text style={styles.noteText}>{result.note}</Text>
            </View>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={22} color="#FF8F00" />
          <Text style={styles.disclaimerText}>
            This calculator gives an estimated recommendation. Actual fertilizer use
            should follow soil test results and local agriculture expert advice.
          </Text>
        </View>
      </ScrollView>

      <SelectModal
        visible={cropModalVisible}
        title="Select Crop Category"
        subtitle="Choose the crop type for fertilizer calculation"
        options={CROP_CATEGORIES}
        selectedValue={form.cropType}
        onSelect={(value) => update('cropType', value)}
        onClose={() => setCropModalVisible(false)}
      />

      <SelectModal
        visible={stageModalVisible}
        title="Select Growth Stage"
        subtitle="Choose the current crop growth stage"
        options={['Seedling', 'Vegetative', 'Flowering', 'Fruiting']}
        selectedValue={form.growthStage}
        onSelect={(value) => update('growthStage', value)}
        onClose={() => setStageModalVisible(false)}
      />

      <SelectModal
        visible={unitModalVisible}
        title="Select Area Unit"
        subtitle="Choose your field area unit"
        options={['acre', 'hectare', 'kanal', 'marla']}
        selectedValue={form.areaUnit}
        onSelect={(value) => update('areaUnit', value)}
        onClose={() => setUnitModalVisible(false)}
      />

      <SelectModal
        visible={soilModalVisible}
        title="Select Soil Type"
        subtitle="Choose the most similar soil type"
        options={['Sandy', 'Loamy', 'Clay']}
        selectedValue={form.soilType}
        onSelect={(value) => update('soilType', value)}
        onClose={() => setSoilModalVisible(false)}
      />

      <SelectModal
        visible={fertilizerModalVisible}
        title="Select Fertilizer Type"
        subtitle="Choose fertilizer type"
        options={['Urea', 'DAP', 'NPK', 'Compost']}
        selectedValue={form.fertilizerType}
        onSelect={(value) => update('fertilizerType', value)}
        onClose={() => setFertilizerModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF6',
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  headerCard: {
    marginTop: 34,
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  headerIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    color: '#E8F5E9',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  formCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 7,
  },
  input: {
    height: 54,
    backgroundColor: '#F1F8F1',
    borderRadius: 17,
    paddingHorizontal: 14,
    color: '#102A12',
    fontWeight: '700',
    fontSize: 15,
  },
  optionBox: {
    height: 54,
    backgroundColor: '#F1F8F1',
    borderRadius: 17,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    color: '#102A12',
    fontWeight: '800',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '900',
  },
  calculateBtn: {
    flex: 1.5,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    flexDirection: 'row',
  },
  calculateText: {
    color: '#fff',
    fontWeight: '900',
    marginLeft: 8,
  },
  resultCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#102A12',
  },
  resultSubtitle: {
    color: '#6A856A',
    marginTop: 3,
  },
  amountBox: {
    marginTop: 18,
    backgroundColor: '#E8F5E9',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
  },
  amountLabel: {
    color: '#6A856A',
    fontWeight: '700',
  },
  amountValue: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
  },
  resultRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultKey: {
    color: '#6A856A',
    fontWeight: '700',
  },
  resultValue: {
    color: '#102A12',
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  noteBox: {
    marginTop: 18,
    backgroundColor: '#FFF8EC',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    color: '#7A5A1A',
    lineHeight: 20,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 18,
    backgroundColor: '#FFF8EC',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 10,
    color: '#7A5A1A',
    lineHeight: 20,
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#102A12',
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#6A856A',
    fontSize: 14,
  },
  cropOption: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F1F8F1',
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropOptionActive: {
    backgroundColor: colors.primary,
  },
  cropOptionText: {
    color: '#102A12',
    fontSize: 16,
    fontWeight: '900',
  },
  cropOptionTextActive: {
    color: '#FFFFFF',
  },
  modalCancel: {
    marginTop: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.primary,
    fontWeight: '900',
  },
});
