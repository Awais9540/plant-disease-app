import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const diseases = [
    "Grape leaf black rot",         
    "Tomato leaf mosaic virus",     
    "Tomato leaf yellow virus",                
    "apple leaf rust",             
    "apple leaf scab",              
    "bell pepper leaf spot",             
                  
                     
    "corn gray leaf spot",          
                       
    "corn leaf blight",             
    "corn leaf rust",               
               
                       
    "potato leaf early blight",     
    "potato leaf late blight",      
    "potato leafroll virus",        
                    
    "squash powedry milddew leaf",  
                  
    "tomato leaf bacterial spot",   
    "tomato leaf early blight",     
              
    "tomato leaf late blight",      
    "tomato leaf mold",             
    "tomato leaf powdery mildew",   
    "tomato septoria leaf spot",
];

export default function DiseaseGuideScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const filtered = diseases.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
      </TouchableOpacity>

      <Text style={styles.title}>Disease Guide</Text>
      <Text style={styles.subtitle}>Symptoms, treatment and prevention for your 29 classes.</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#6A856A" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search disease..."
          placeholderTextColor="#8BA18B"
          style={styles.searchInput}
        />
      </View>

      {filtered.map((item) => (
        <View key={item} style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="leaf-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.disease}>{item}</Text>
            <Text style={styles.text}>Symptoms: spots, discoloration, curling, lesions, or healthy leaf condition.</Text>
            <Text style={styles.text}>Action: remove infected parts, avoid overhead watering, use recommended spray if needed.</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6FBF6' },
  content: { padding: 18, paddingBottom: 120 },
  backBtn: {
    marginTop: 32,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { marginTop: 18, fontSize: 32, fontWeight: '900', color: '#102A12' },
  subtitle: { marginTop: 6, color: '#6A856A', fontWeight: '600' },
  searchBox: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    height: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontWeight: '700', color: '#102A12' },
  card: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    elevation: 3,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disease: { fontSize: 17, fontWeight: '900', color: '#102A12', textTransform: 'capitalize' },
  text: { marginTop: 7, color: '#6A856A', lineHeight: 20, fontWeight: '600' },
});