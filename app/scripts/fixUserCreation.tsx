import { View, Text, StyleSheet, Button, TextInput, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { supabase, diagnoseUserCreation } from '../../utils/supabase';

export default function FixUserCreationScreen() {
  const [email, setEmail] = useState('admin@radio47.fm');
  const [password, setPassword] = useState('admin123');
  const [firstName, setFirstName] = useState('Admin');
  const [lastName, setLastName] = useState('User');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    addLog('Checking Supabase connection...');
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        addLog(`Connection error: ${error.message}`);
      } else {
        addLog(`Connection successful! Found ${data?.length || 0} profiles.`);
      }
    } catch (error) {
      addLog(`Connection check failed: ${(error as any).message}`);
    }
  };

  const createUser = async () => {
    setIsLoading(true);
    addLog(`Attempting to create user: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        addLog(`Error creating user: ${error.message}`);
      } else if (data?.user) {
        addLog(`User created successfully: ${data.user.id}`);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
          }]);
          
        if (profileError) {
          addLog(`Error creating profile: ${profileError.message}`);
        } else {
          addLog('Profile created successfully!');
        }
      } else {
        addLog('No error, but no user was created. Email confirmation might be required.');
      }
    } catch (error) {
      addLog(`Unexpected error: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const diagnoseIssue = async () => {
    setIsLoading(true);
    addLog(`Diagnosing user creation for: ${email}`);
    
    try {
      const result = await diagnoseUserCreation(email);
      addLog(`Diagnosis result: ${result.message}`);
      
      if (!result.success && result.error) {
        addLog(`Error details: ${JSON.stringify(result.error)}`);
      }
    } catch (error) {
      addLog(`Diagnosis failed: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Fix User Creation',
        headerStyle: {
          backgroundColor: '#1E3EA1',
        },
        headerTintColor: '#fff',
      }} />

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Supabase User Management</Text>
        <Text style={styles.subtitle}>Diagnose and fix user creation issues</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
          
          <View style={styles.buttonRow}>
            <View style={styles.button}>
              <Button 
                title="Check Connection" 
                onPress={checkConnection} 
                disabled={isLoading}
                color="#1E3EA1"
              />
            </View>
            
            <View style={styles.button}>
              <Button 
                title="Create User" 
                onPress={createUser} 
                disabled={isLoading}
                color="#1E3EA1"
              />
            </View>
            
            <View style={styles.button}>
              <Button 
                title="Diagnose Issue" 
                onPress={diagnoseIssue} 
                disabled={isLoading}
                color="#FF3B30"
              />
            </View>
          </View>
        </View>

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Logs</Text>
          <ScrollView style={styles.logsScroll}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logEntry}>{log}</Text>
            ))}
            {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    minWidth: 100,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logsScroll: {
    maxHeight: 300,
  },
  logEntry: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#1E3EA1',
    fontStyle: 'italic',
    marginTop: 8,
  },
});