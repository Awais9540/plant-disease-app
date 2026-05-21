import React from 'react';
import { Image, Text, View } from 'react-native';

const normalizeImage = (img) => {
  if (!img) return null;

  if (img.startsWith('file://')) return img;
  if (img.startsWith('data:image')) return img;
  if (img.startsWith('http')) return img;

  return `data:image/jpeg;base64,${img}`;
};

const HeatmapWidget = ({ originalImage, heatmapImage }) => {
  const original = normalizeImage(originalImage);
  const heatmap = normalizeImage(heatmapImage);

  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10 }}>
          Original Leaf
        </Text>

        {original && (
          <Image
            source={{ uri: original }}
            style={{
              width: '100%',
              height: 210,
              borderRadius: 16,
              backgroundColor: '#E8F5E9',
            }}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10 }}>
          AI Heatmap
        </Text>

        {heatmap ? (
          <Image
            source={{ uri: heatmap }}
            style={{
              width: '100%',
              height: 210,
              borderRadius: 16,
              backgroundColor: '#E8F5E9',
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 210,
              borderRadius: 16,
              backgroundColor: '#E8F5E9',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>No heatmap</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default HeatmapWidget;
