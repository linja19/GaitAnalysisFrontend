import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';
import { Accelerometer, Gyroscope  } from 'expo-sensors';
import { sendData } from './utils';
import React, { useState, useEffect } from 'react';

const HomeScreen = ({navigation}) => {
    
  
    return (
      <View style={styles.container}>
        <Text style={styles.text}>实验模式，普通模式，查看历史数据</Text>
        <TouchableWithoutFeedback onPress={()=>{
          navigation.navigate('Experiment');
        }
        }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>实验模式</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={()=>{
          navigation.navigate('Normal');
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>普通模式</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={()=>{
          navigation.navigate('Data');
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>查看历史数据</Text>
          </View>
        </TouchableWithoutFeedback>
        
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 20,
      marginBottom: 20,
    },
    button: {
      backgroundColor: '#007aff',
      borderRadius: 5,
      padding: 10,
      margin: 5,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default HomeScreen;