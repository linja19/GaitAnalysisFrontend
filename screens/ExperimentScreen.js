import { StyleSheet, Text, View, TouchableWithoutFeedback, ToastAndroid } from 'react-native';
import { Accelerometer, Gyroscope  } from 'expo-sensors';
import { sendData, mergeData } from './utils';
import React, { useState, useEffect } from 'react';

const ExperimentScreen = ({navigation}) => {
    const android = Platform.OS==='android';
    // console.log(android)
    const [n, setN] = useState(0)
    const [subscription, setSubscription] = useState(null);
    const [g_subscription, setGSubscription] = useState(null);
    const [walkData, setData] = useState([])
    const [gyroData, setGyroData] = useState([])
    const [state, setState] = useState("Stopped")
    const [msg,setMsg] = useState("")
  
    Gyroscope.setUpdateInterval(35);
    Accelerometer.setUpdateInterval(35);
  
    const _subscribe = async () => {
      if(state=="Recording"){
        let notification = "Stop recording first"
        const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
        return
      }else if(n!=0){
        _clear();
      }
      setMsg("")
      const re = await Gyroscope.requestPermissionsAsync()
      if (re.status == "granted") {
        console.log("Subscribe")
        setSubscription(
          // Accelerometer.addListener(setXYZ);
          Accelerometer.addListener(accelerometerData => {
            let unixTime = new Date().getTime();
            accelerometerData["t"] = unixTime;
            if(!android) accelerometerData["y"]=-accelerometerData["y"];
            if(android) accelerometerData["z"]=-accelerometerData["z"];
            setData((prevData)=>[...prevData,accelerometerData]);
          })
        );
        setGSubscription(
          Gyroscope.addListener(gyroscopeData => {
            let unixTime = new Date().getTime();
            gyroscopeData["t"] = unixTime;
            setGyroData((prevData)=>[...prevData,gyroscopeData]);
          })
        );
      }else{
        console.log("Not Granted")
      }
    };
  
    const _unsubscribe = () => {
      console.log("Unsubscribe")
      subscription && subscription.remove();
      setSubscription(null);
      g_subscription && g_subscription.remove();
      Accelerometer.removeAllListeners();
      Gyroscope.removeAllListeners();
      setGSubscription(null);
      let dataCount = walkData.length
      // console.log(walkData)
      setN(dataCount);
    };
  
    const _clear = async () => {
      if(state=="Recording"){
        let notification = "Stop recording first"
        const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
        return
      }
      let merge = mergeData(walkData,gyroData,40)
      if (merge.length==0){
        const notification = "No data"
        const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
        return
      }
      const res = await sendData(merge,"experiment");
      console.log(res)
      try{
        if (res['error']){
          setMsg("ERROR"+" "+res['error'])
        }else{
          setMsg("Success"+'\n'+"Double: "+res['Double']+'\n'+"Assymetry: "+res['Asymmetry']+'\n'+"Swing Variation: "+res['SwingVar']+'\n')
        }
      }catch(e){
        console.log(e)
        return
      }
      // if (res['error']){
      //   setMsg("ERROR"+" "+res['error'])
      // }else{
      //   setMsg("Success"+'\n'+"Double: "+res['Double']+'\n'+"Assymetry: "+res['Asymmetry']+'\n'+"Swing Variation: "+res['SwingVar']+'\n')
      // }
      console.log("Clear");
      setN(0);
      setData([]);
      setGyroData([]);
      let notification = "Cleared"
      const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
      setState("Saved");
    }
  
    return (
      <View style={styles.container}>
        <Text style={styles.text}>实验模式</Text>
        <Text style={styles.text}>不筛选数据，用户需要进行平地行走，点击保存数据才能记录</Text>
        <Text style={styles.text}>点击“开始”以开始采集加速度数据</Text>
        <TouchableWithoutFeedback onPress={()=>{
          setState("Recording");
          _subscribe();
        }
        }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>开始</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onLongPress={()=>{
          _unsubscribe();
          setState("Stopped");
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>长按停止</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={()=>{
          _clear();
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>保存数据并清除</Text>
          </View>
        </TouchableWithoutFeedback>
        <Text style={[styles.text,state=="Recording"?styles.textRecording:styles.text]}>State: {state}</Text>
        <Text style={styles.text}>Message: {msg}</Text>
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
      marginBottom: 5,
      marginTop:20,
    },
    textRecording:{
        fontSize: 20,
        marginBottom: 20,
        marginTop:20,
        color: 'red'
    },
    button: {
      backgroundColor: '#007aff',
      borderRadius: 5,
      padding: 10,
      margin: 5,
      marginTop: 15,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default ExperimentScreen;