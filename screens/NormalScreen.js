import { StyleSheet, Text, View, TouchableWithoutFeedback, ToastAndroid, PermissionsAndroid  } from 'react-native';
import { Accelerometer, Gyroscope, DeviceMotion  } from 'expo-sensors';
import * as Location from 'expo-location';
import { sendData,mergeData } from './utils';
import React, { useState, useEffect, useRef } from 'react';

// import { useProximity } from './useProximity';
// import { startProximity, stopProximity } from 'react-native-proximity-screen';
// 1分钟自动上传

let state = "Stopped"
const setState = (newState) => {
  state = newState
}


const NormalScreen = ({navigation}) => {
  // const { hasProximity } = useProximity();
  // if (hasProximity) return <BlackScreen />;

  const android = Platform.OS==='android';
  const [n, setN] = useState(0)
  const [subscription, setSubscription] = useState(null);
  const [g_subscription, setGSubscription] = useState(null);
  const [gyroXData,setGyroXData] = useState([])
  const [walkData, setData] = useState([])
  const [gyroData, setGyroData] = useState([])
  // const [state, setState] = useState("Stopped")
  const [msg,setMsg] = useState("")
  const [success,setSuccess] = useState(0)
  const [fail,setFail] = useState(0)
  const [positive,setPositive] = useState(true)
  const [positiveNum, setPositiveNum] = useState(0)
  const nRef = useRef(walkData.length)
  nRef.current = walkData.length
  const walkDataRef = useRef(walkData)
  walkDataRef.current = walkData
  const gyroDataRef = useRef(gyroData)
  gyroDataRef.current = gyroData
  const successRef = useRef(success)
  successRef.current = success
  const failRef = useRef(fail)
  failRef.current = fail
  const gyroXRef = useRef(gyroXData)
  gyroXRef.current = gyroXData
  const positiveRef = useRef(positive)
  positiveRef.current = positive
  const positiveNumRef = useRef(positiveNum)
  positiveNumRef.current = positiveNum
  const [stateShow,setStateShow] = useState(state);


  let rotation = 0;

  let timer;//把timer移到函数里
  let timer2;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const _checkStart = async (isSet) => {
    if (isSet){
      setState("Detecting rotation")
      setStateShow("Detecting rotation")
    }
    DeviceMotion.setUpdateInterval(10000);
    DeviceMotion.addListener(async (dev) => {
      setStateShow("Detecting rotation")
      let res = dev.rotation.alpha + dev.rotation.beta + dev.rotation.gamma
      console.log("rotation",res)
      if (rotation==0){
        rotation = res
      }
      let delta = res - rotation
      if ((delta>0.5)||(delta<-0.5)) {
        console.log("detect rotation",res)
        rotation = res
        DeviceMotion.removeAllListeners()
        console.log("stop device motion detection, start gyroscope detection")
        setStateShow("Detecting angular velocity")
        await _subscribeLowRate();  //setState to Detecting
        timer2 = setTimeout(async()=>{
          if (state!="Stopped"){
            _unsubscribeLowRate();  //setState to Stop Detecting
            if (positiveNumRef.current>=10){
              clearTimeout(timer2);
              timer2 = null;
              _start();
            }else{
              // console.log("Please walk first")
              await sleep(5000);
              // console.log("state ",state)
              _checkStart(false);
            }
          }
        },10000)
      }
    })

    
  }

  const _subscribeLowRate = async () => {
    console.log("state",state)
    if (state=="Stopped"){
      // console.log("state is stopped")
      return
    }
    console.log("Subscrbe Low Rate")
    setPositiveNum(0);
    Gyroscope.setUpdateInterval(200);
    const re = await Gyroscope.requestPermissionsAsync()
    if (re.status == "granted") {
      setState("Detecting angular velocity");
      // console.log("Detecting")
      setGSubscription(
        Gyroscope.addListener(gyroData => {
          let unixTime = new Date().getTime();
          let gX = gyroData["x"];
          if ((positiveRef.current&&gX<-2)||(!positiveRef.current&&gX>-2)){
            setPositiveNum(positiveNumRef.current+1)
            setPositive(gX>-2)
            console.log(positiveNumRef.current)
          }
        })
      );
    }
  }

  const _unsubscribeLowRate = () => {
    setState("Stop Detecting Angular Velocity");
    g_subscription && g_subscription.remove();
    setGSubscription(null);
    Gyroscope.removeAllListeners();
  };

  const _start = async () => {
    // setState("Recording")
    // setMsg("")
    // setSuccess(0)
    await _subscribe(); //setState to Recording
    timer = setTimeout(async()=>{
      if (state!="Stopped"){
        _unsubscribe();  //setState to Paused
        // console.log("data",walkDataRef.current)
        let merge = mergeData(walkDataRef.current,gyroDataRef.current,40)
        if (merge.length==0){
          const notification = "No data"
          const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
          // console.log("re")
          return
        }
        const res = await sendData(merge,"normal");
        try{
          if (res['error']=="Didn't found user template signal"){
            setMsg("Didn't found user template signal, use experiment mode first")
            return
          }else if (res['error']){
            console.log("ERROR",failRef.current)
            setFail(failRef.current+1)
            setMsg("ERROR"+" "+res['error'])
          }else{
            setSuccess(successRef.current+1)
            setMsg("Success"+'\n'+"Double: "+res['Double']+'\n'+"Assymetry: "+res['Asymmetry']+'\n'+"Swing Variation: "+res['SwingVar']+'\n')
          }
          
        }catch(e){
          console.log(e)
          return
        }
        if (failRef.current>=5){
          clearTimeout(timer);
          timer = null;
          setSuccess(0);
          setFail(0);
          _checkStart();
        }else{
          setData([]);
          setGyroData([]);
          setState("Saved");
          _start();  //setState to Recording
        }
      }
    },5000)
    // interval = setInterval(() => {


  }

  const _subscribe = async () => {
    Gyroscope.setUpdateInterval(35);
    Accelerometer.setUpdateInterval(35);
    if(state=="Recording"){
      let notification = "Stop recording first"
      console.log(notification)
      const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
      return
    }else if(n!=0){
      _clear();
    }
    const re = await Gyroscope.requestPermissionsAsync()
    if (re.status == "granted") {
      setState("Recording");
      // console.log("Subscribe")
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
    
    setState("Paused");
    // console.log("Unsubscribe")
    subscription && subscription.remove();
    setSubscription(null);
    g_subscription && g_subscription.remove();
    Accelerometer.removeAllListeners();
    Gyroscope.removeAllListeners();
    setGSubscription(null);
    let dataCount = walkData.length
    setN(dataCount);
    // console.log("data",dataCount)
  };

  const _stop = () => {
    DeviceMotion.removeAllListeners();
    clearTimeout(timer);
    timer = null;
    clearTimeout(timer2);
    timer2 = null;
    _unsubscribe();
    _unsubscribeLowRate();
    
    setPositiveNum(0);
    _clear();
    setState("Stopped");
    setStateShow("Stopped");
    // console.log(state);
  }

  const _clear = () => {
    let merge = mergeData(walkData,gyroData,40)
    if (merge.length==0){
      const notification = "No data"
      const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
      return
    }
    sendData(merge,"normal");
    console.log("Clear");
    setN(0);
    setData([]);
    setGyroData([]);
    let notification = "Cleared"
    const showMessage = android?ToastAndroid.show(notification, ToastAndroid.SHORT):null;
    // setState("Saved");
  }

  useEffect(() => {
    setStateShow(state);
    // console.log("setStateto",sta/teShow)
  }, [state]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>普通模式</Text>
      <Text style={styles.text}>开始后每隔1分钟上传一次数据，会自动筛选平地数据</Text>
      <Text style={styles.text}>点击“开始”以开始采集加速度数据</Text>
      <TouchableWithoutFeedback onPress={()=>{
        setMsg("")
        setSuccess(0)
        setFail(0)
        // setState("Detecting");
        _checkStart(true);
      }
      }>
        <View style={styles.button}>
          <Text style={styles.buttonText}>开始检测</Text>
        </View>
      </TouchableWithoutFeedback>
      {/* <TouchableWithoutFeedback onPress={()=>{
        setMsg("")
        // setSuccess(0)
        // setFail(0)
        _start();
      }
      }>
        <View style={styles.button}>
          <Text style={styles.buttonText}>开始</Text>
        </View>
      </TouchableWithoutFeedback> */}
      <TouchableWithoutFeedback onLongPress={()=>{
        _stop();
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>长按停止</Text>
        </View>
      </TouchableWithoutFeedback>
      <Text style={[styles.text,state=="Recording"?styles.textRecording:styles.text]}>State: {stateShow}</Text>
      <Text style={styles.text}>Successful/Fail: {success}/{fail}</Text>
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

export default NormalScreen;