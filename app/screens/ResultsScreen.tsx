import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VirusTotalResponse {
  positives: number;
  total: number;
  url: string;
}

export default function ResultsScreen() {
  const { scannedData } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VirusTotalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkURL();
  }, []);

  const checkURL = async () => {
    try {
      // Get API key from storage or use environment variable
      const apiKey = await AsyncStorage.getItem('virusTotalApiKey');
      
      if (!apiKey) {
        setError('Please set your VirusTotal API key in the settings');
        setLoading(false);
        return;
      }

      // First, submit the URL to VirusTotal
      const submitResponse = await axios.post(
        'https://www.virustotal.com/vtapi/v2/url/scan',
        new URLSearchParams({
          apikey: apiKey,
          url: scannedData as string,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Wait a bit and then get the results
      setTimeout(async () => {
        const reportResponse = await axios.get(
          'https://www.virustotal.com/vtapi/v2/url/report',
          {
            params: {
              apikey: apiKey,
              resource: submitResponse.data.scan_id,
            },
          }
        );

        setResult(reportResponse.data);
        setLoading(false);
      }, 3000);
    } catch (err) {
      setError('Failed to check URL. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Analyzing URL...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.resultContainer}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.url}>URL: {scannedData}</Text>
        {result && (
          <>
            <Text style={styles.result}>
              Detections: {result.positives} / {result.total}
            </Text>
            <Text style={[
              styles.status,
              { color: result.positives > 0 ? 'red' : 'green' }
            ]}>
              Status: {result.positives > 0 ? 'Malicious' : 'Safe'}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  url: {
    fontSize: 16,
    marginBottom: 10,
  },
  result: {
    fontSize: 18,
    marginBottom: 10,
  },
  status: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
}); 