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

const UNITS = ['acre', 'hectare', 'marla', 'kanal', 'square meter', 'square feet'];

const SQ_METER_PER_UNIT = {
  acre: 4046.8564224,
  hectare: 10000,
  marla: 25.2929,
  kanal: 505.857,
  'square meter': 1,
  'square feet': 0.092903,
};

const DEFAULT_CONVERTER = {
  value: '1',
  from: 'acre',
  to: 'hectare',
};

const DEFAULT_MEASUREMENT = {
  length: '100',
  width: '50',
  unit: 'square feet',
};

const convertArea = (value, from, to) => {
  const number = Number(value);
  if (!number || number <= 0) return 0;

  const fromRate = SQ_METER_PER_UNIT[from];
  const toRate = SQ_METER_PER_UNIT[to];

  if (!fromRate || !toRate) return 0;

  const squareMeters = number * fromRate;
  return squareMeters / toRate;
};

const areaToAllUnits = (areaValue, unit) => {
  const number = Number(areaValue);
  if (!number || number <= 0) return {};

  const squareMeters = number * (SQ_METER_PER_UNIT[unit] || 1);

  const result = {};
  UNITS.forEach((u) => {
    result[u] = squareMeters / SQ_METER_PER_UNIT[u];
  });

  return result;
};

export default function FarmingCalculatorScreen() {
  const [mode, setMode] = useState('converter');

  const [converter, setConverter] = useState(DEFAULT_CONVERTER);
  const [measurement, setMeasurement] = useState(DEFAULT_MEASUREMENT);

  const [fromModalVisible, setFromModalVisible] = useState(false);
  const [toModalVisible, setToModalVisible] = useState(false);
  const [measurementUnitModalVisible, setMeasurementUnitModalVisible] = useState(false);

  useEffect(() => {
    getCalculatorInputs().then((data) => {
      if (data?.farming?.converter) setConverter(data.farming.converter);
      if (data?.farming?.measurement) setMeasurement(data.farming.measurement);
    });
  }, []);

  const saveInputs = async (updatedConverter = converter, updatedMeasurement = measurement) => {
    const old = await getCalculatorInputs();

    await saveCalculatorInputs({
      ...old,
      farming: {
        converter: updatedConverter,
        measurement: updatedMeasurement,
      },
    });
  };

  const updateConverter = async (key, value) => {
    const updated = { ...converter, [key]: value };
    setConverter(updated);
    await saveInputs(updated, measurement);
  };

  const updateMeasurement = async (key, value) => {
    const updated = { ...measurement, [key]: value };
    setMeasurement(updated);
    await saveInputs(converter, updated);
  };

  const clearAll = async () => {
    setConverter(DEFAULT_CONVERTER);
    setMeasurement(DEFAULT_MEASUREMENT);

    const old = await getCalculatorInputs();

    await saveCalculatorInputs({
      ...old,
      farming: {
        converter: DEFAULT_CONVERTER,
        measurement: DEFAULT_MEASUREMENT,
      },
    });
  };

  const converted = convertArea(converter.value, converter.from, converter.to);

  const rawArea =
    Number(measurement.length || 0) * Number(measurement.width || 0);

  const measurementResults = areaToAllUnits(rawArea, measurement.unit);

  const inputField = (label, value, onChangeText, keyboardType = 'numeric') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
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

  const SelectModal = ({ visible, title, selectedValue, onSelect, onClose }) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>Choose area unit</Text>

          {UNITS.map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.modalOption,
                selectedValue === unit && styles.modalOptionActive,
              ]}
              onPress={() => {
                onSelect(unit);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedValue === unit && styles.modalOptionTextActive,
                ]}
              >
                {unit}
              </Text>

              {selectedValue === unit && (
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
            <Ionicons name="resize-outline" size={34} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Farming Area Calculator</Text>
            <Text style={styles.subtitle}>
              Convert farm units and calculate field area from length and width.
            </Text>
          </View>
        </View>

        <View style={styles.modeBox}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'converter' && styles.modeBtnActive]}
            onPress={() => setMode('converter')}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'converter' && styles.modeTextActive,
              ]}
            >
              Unit Converter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'measurement' && styles.modeBtnActive]}
            onPress={() => setMode('measurement')}
          >
            <Text
              style={[
                styles.modeText,
                mode === 'measurement' && styles.modeTextActive,
              ]}
            >
              Field Measurement
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'converter' && (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Convert Area Unit</Text>

            {inputField('Value', converter.value, (value) =>
              updateConverter('value', value)
            )}

            {dropdownField('From Unit', converter.from, () =>
              setFromModalVisible(true)
            )}

            {dropdownField('To Unit', converter.to, () =>
              setToModalVisible(true)
            )}

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Converted Value</Text>
              <Text style={styles.resultValue}>
                {Number.isFinite(converted) ? converted.toFixed(4) : '0'}{' '}
                {converter.to}
              </Text>

              <Text style={styles.resultSub}>
                {converter.value || 0} {converter.from} ={' '}
                {Number.isFinite(converted) ? converted.toFixed(4) : '0'}{' '}
                {converter.to}
              </Text>
            </View>
          </View>
        )}

        {mode === 'measurement' && (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Measure Field Area</Text>

            {inputField('Length', measurement.length, (value) =>
              updateMeasurement('length', value)
            )}

            {inputField('Width', measurement.width, (value) =>
              updateMeasurement('width', value)
            )}

            {dropdownField('Measurement Unit', measurement.unit, () =>
              setMeasurementUnitModalVisible(true)
            )}

            <View style={styles.fieldBox}>
              <View style={styles.fieldRectangle}>
                <Text style={styles.fieldText}>
                  {measurement.length || 0} × {measurement.width || 0}
                </Text>
              </View>
              <Text style={styles.fieldLabel}>Visual field rectangle</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Raw Area</Text>
              <Text style={styles.resultValue}>
                {rawArea.toFixed(2)} {measurement.unit}
              </Text>
            </View>

            <View style={styles.allUnitsCard}>
              <Text style={styles.cardTitle}>Area in All Units</Text>

              {UNITS.map((unit) => (
                <View key={unit} style={styles.unitRow}>
                  <Text style={styles.unitName}>{unit}</Text>
                  <Text style={styles.unitValue}>
                    {measurementResults[unit]
                      ? measurementResults[unit].toFixed(4)
                      : '0'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
          <Ionicons name="refresh-outline" size={20} color="#1976D2" />
          <Text style={styles.clearText}>Reset Calculator</Text>
        </TouchableOpacity>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={22} color="#1976D2" />
          <Text style={styles.disclaimerText}>
            Area conversion is approximate and useful for planning fertilizer,
            pesticide, and land measurement calculations.
          </Text>
        </View>
      </ScrollView>

      <SelectModal
        visible={fromModalVisible}
        title="Select From Unit"
        selectedValue={converter.from}
        onSelect={(value) => updateConverter('from', value)}
        onClose={() => setFromModalVisible(false)}
      />

      <SelectModal
        visible={toModalVisible}
        title="Select To Unit"
        selectedValue={converter.to}
        onSelect={(value) => updateConverter('to', value)}
        onClose={() => setToModalVisible(false)}
      />

      <SelectModal
        visible={measurementUnitModalVisible}
        title="Select Measurement Unit"
        selectedValue={measurement.unit}
        onSelect={(value) => updateMeasurement('unit', value)}
        onClose={() => setMeasurementUnitModalVisible(false)}
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
    backgroundColor: '#1976D2',
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
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#E3F2FD',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  modeBox: {
    marginTop: 18,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 6,
    flexDirection: 'row',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#1976D2',
  },
  modeText: {
    color: '#1976D2',
    fontWeight: '900',
    fontSize: 13,
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#102A12',
    marginBottom: 14,
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
    backgroundColor: '#E3F2FD',
    borderRadius: 17,
    paddingHorizontal: 14,
    color: '#102A12',
    fontWeight: '700',
    fontSize: 15,
  },
  optionBox: {
    height: 54,
    backgroundColor: '#E3F2FD',
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
  resultCard: {
    marginTop: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
  },
  resultLabel: {
    color: '#426B91',
    fontWeight: '800',
  },
  resultValue: {
    marginTop: 6,
    color: '#1976D2',
    fontSize: 29,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultSub: {
    marginTop: 8,
    color: '#426B91',
    fontWeight: '700',
    textAlign: 'center',
  },
  fieldBox: {
    marginTop: 6,
    marginBottom: 14,
    backgroundColor: '#F1F8FF',
    borderRadius: 22,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldRectangle: {
    width: 210,
    height: 82,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  fieldText: {
    color: '#1976D2',
    fontWeight: '900',
  },
  fieldLabel: {
    marginTop: 10,
    color: '#426B91',
    fontWeight: '700',
  },
  allUnitsCard: {
    marginTop: 16,
    backgroundColor: '#F8FBFF',
    borderRadius: 22,
    padding: 16,
  },
  unitRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitName: {
    color: '#426B91',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  unitValue: {
    color: '#102A12',
    fontWeight: '900',
  },
  clearBtn: {
    marginTop: 18,
    backgroundColor: '#E3F2FD',
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  clearText: {
    color: '#1976D2',
    fontWeight: '900',
    marginLeft: 8,
  },
  disclaimer: {
    marginTop: 18,
    backgroundColor: '#E3F2FD',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 10,
    color: '#426B91',
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
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionActive: {
    backgroundColor: '#1976D2',
  },
  modalOptionText: {
    color: '#102A12',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  modalOptionTextActive: {
    color: '#FFFFFF',
  },
  modalCancel: {
    marginTop: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#1976D2',
    fontWeight: '900',
  },
});
