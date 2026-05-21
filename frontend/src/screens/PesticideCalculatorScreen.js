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
  pesticideType: 'Fungicide',
  dosePerLiter: '2',
  tankSize: '16',
  numberOfTanks: '1',
  severity: 'Medium',
};

export default function PesticideCalculatorScreen() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);

  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [pesticideModalVisible, setPesticideModalVisible] = useState(false);
  const [severityModalVisible, setSeverityModalVisible] = useState(false);

  useEffect(() => {
    getCalculatorInputs().then((data) => {
      if (data?.pesticide) setForm(data.pesticide);
    });
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calculate = async () => {
    const dose = Number(form.dosePerLiter);
    const tank = Number(form.tankSize);
    const tanks = Number(form.numberOfTanks);

    if (!dose || dose <= 0) {
      Alert.alert('Invalid Dose', 'Please enter a valid dose per liter.');
      return;
    }

    if (!tank || tank <= 0) {
      Alert.alert('Invalid Tank Size', 'Please enter a valid tank size.');
      return;
    }

    if (!tanks || tanks <= 0) {
      Alert.alert('Invalid Tanks', 'Please enter a valid number of tanks.');
      return;
    }

    let severityFactor = 1;

    if (form.severity === 'Low') severityFactor = 0.8;
    if (form.severity === 'Medium') severityFactor = 1;
    if (form.severity === 'High') severityFactor = 1.2;

    const totalWater = tank * tanks;
    const totalPesticideMl = dose * totalWater * severityFactor;

    const output = {
      pesticideType: form.pesticideType,
      totalWater: `${totalWater.toFixed(1)} L`,
      totalPesticide: `${totalPesticideMl.toFixed(1)} ml`,
      perTank: `${(dose * tank * severityFactor).toFixed(1)} ml per tank`,
      doseUsed: `${(dose * severityFactor).toFixed(2)} ml/L`,
      sprayAdvice:
        form.severity === 'High'
          ? 'Spray carefully and repeat only if recommended by an agriculture expert.'
          : 'Spray evenly on affected leaves during morning or evening.',
      safety:
        'Wear gloves, mask, and avoid spraying during strong wind or direct hot sunlight.',
    };

    setResult(output);

    const old = await getCalculatorInputs();
    await saveCalculatorInputs({
      ...old,
      pesticide: form,
    });
  };

  const clearForm = async () => {
    setForm(DEFAULT_FORM);
    setResult(null);

    const old = await getCalculatorInputs();
    await saveCalculatorInputs({
      ...old,
      pesticide: DEFAULT_FORM,
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
                styles.modalOption,
                selectedValue === option && styles.modalOptionActive,
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedValue === option && styles.modalOptionTextActive,
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
            <Ionicons name="flask-outline" size={34} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Pesticide Calculator</Text>
            <Text style={styles.subtitle}>
              Calculate spray dose, water volume, and pesticide quantity.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {dropdownField('Crop Category', form.cropType, () => setCropModalVisible(true))}

          {dropdownField('Pesticide Type', form.pesticideType, () => setPesticideModalVisible(true))}

          {inputField('Dose per Liter (ml/L)', form.dosePerLiter, 'dosePerLiter', 'numeric')}

          {inputField('Tank Size (liters)', form.tankSize, 'tankSize', 'numeric')}

          {inputField('Number of Tanks', form.numberOfTanks, 'numberOfTanks', 'numeric')}

          {dropdownField('Disease Severity', form.severity, () => setSeverityModalVisible(true))}

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
                <Ionicons name="checkmark-circle" size={30} color="#FF8F00" />
              </View>

              <View>
                <Text style={styles.resultTitle}>{result.pesticideType}</Text>
                <Text style={styles.resultSubtitle}>Spray Mixing Plan</Text>
              </View>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total Pesticide Required</Text>
              <Text style={styles.amountValue}>{result.totalPesticide}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Total Water</Text>
              <Text style={styles.resultValue}>{result.totalWater}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Per Tank</Text>
              <Text style={styles.resultValue}>{result.perTank}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Dose Used</Text>
              <Text style={styles.resultValue}>{result.doseUsed}</Text>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="leaf-outline" size={20} color={colors.primary} />
              <Text style={styles.noteText}>{result.sprayAdvice}</Text>
            </View>

            <View style={styles.safetyBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#C62828" />
              <Text style={styles.safetyText}>{result.safety}</Text>
            </View>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={22} color="#FF8F00" />
          <Text style={styles.disclaimerText}>
            Always follow the pesticide label instructions. Use protective equipment and avoid over-application.
          </Text>
        </View>
      </ScrollView>

      <SelectModal
        visible={cropModalVisible}
        title="Select Crop Category"
        subtitle="Choose the crop for spray calculation"
        options={CROP_CATEGORIES}
        selectedValue={form.cropType}
        onSelect={(value) => update('cropType', value)}
        onClose={() => setCropModalVisible(false)}
      />

      <SelectModal
        visible={pesticideModalVisible}
        title="Select Pesticide Type"
        subtitle="Choose the type of spray chemical"
        options={['Fungicide', 'Insecticide', 'Bactericide', 'Herbicide', 'Organic Spray']}
        selectedValue={form.pesticideType}
        onSelect={(value) => update('pesticideType', value)}
        onClose={() => setPesticideModalVisible(false)}
      />

      <SelectModal
        visible={severityModalVisible}
        title="Select Disease Severity"
        subtitle="Adjust dose based on infection level"
        options={['Low', 'Medium', 'High']}
        selectedValue={form.severity}
        onSelect={(value) => update('severity', value)}
        onClose={() => setSeverityModalVisible(false)}
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
    backgroundColor: '#FF8F00',
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
    backgroundColor: 'rgba(255,255,255,0.24)',
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
    color: '#FFF3E0',
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
    backgroundColor: '#FFF8EC',
    borderRadius: 17,
    paddingHorizontal: 14,
    color: '#102A12',
    fontWeight: '700',
    fontSize: 15,
  },
  optionBox: {
    height: 54,
    backgroundColor: '#FFF8EC',
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
    backgroundColor: '#FFF3E0',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  clearText: {
    color: '#FF8F00',
    fontWeight: '900',
  },
  calculateBtn: {
    flex: 1.5,
    backgroundColor: '#FF8F00',
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
    backgroundColor: '#FFF3E0',
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
    backgroundColor: '#FFF3E0',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
  },
  amountLabel: {
    color: '#7A5A1A',
    fontWeight: '700',
  },
  amountValue: {
    marginTop: 6,
    color: '#FF8F00',
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
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    color: '#4F724F',
    lineHeight: 20,
    fontWeight: '600',
  },
  safetyBox: {
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
  },
  safetyText: {
    flex: 1,
    marginLeft: 8,
    color: '#8A1F1F',
    lineHeight: 20,
    fontWeight: '700',
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
  modalOption: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionActive: {
    backgroundColor: '#FF8F00',
  },
  modalOptionText: {
    color: '#102A12',
    fontSize: 16,
    fontWeight: '900',
  },
  modalOptionTextActive: {
    color: '#FFFFFF',
  },
  modalCancel: {
    marginTop: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FF8F00',
    fontWeight: '900',
  },
});
