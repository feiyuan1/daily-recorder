import { Button, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';

export default function SuccessScreen() {
  const params = useLocalSearchParams<{ title: string; uri: string; assetId: string }>();
  const { title, uri, assetId } = params;

  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFile = async () => {
      const file = new File(uri);
      setExists(file.exists);
    };
    checkFile();
  }, [uri]);

  const handleRecordAnother = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.heading}>Video Saved</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.value}>{title}</Text>

        <Text style={styles.label}>Filename</Text>
        <Text style={styles.value}>{Paths.basename(new File(uri))}</Text>

        <Text style={styles.label}>Media asset</Text>
        <Text style={styles.value}>{assetId}</Text>

        <Text style={styles.label}>File exists</Text>
        <Text style={styles.value}>{exists === null ? 'Checking…' : exists ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Record another" onPress={handleRecordAnother} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 56,
    color: '#28a745',
    marginBottom: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#111',
    marginTop: 2,
  },
  buttons: {
    width: '100%',
  },
});
