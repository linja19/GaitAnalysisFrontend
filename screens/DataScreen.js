import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { mock_data,mock_data2 } from '../mockData';
import { processData, fetchData, processPeriodData } from './utils';

const BeizerLine = (props) => {
  const {data} = props
  return (
    <View style={{ flex: 1 }}>
      <LineChart
        data={data}
        width={Dimensions.get("window").width-10} // from react-native
        height={220}
        yAxisInterval={1} // optional, defaults to 1
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          decimalPlaces: 2, // optional, defaults to 2dp
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#ffa726"
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          marginLeft: 8,
          marginRight: 8,
          // borderRadius: 16
        }}
      />
    </View>
  );
}

const DataScreen = () => {
  const {_double,_asymm,_variation} = processPeriodData(mock_data2,'1d');
  const [data, setData] = useState([]);
  const [double, setDouble] = useState(_double);
  const [asymm, setAsymm] = useState(_asymm);
  const [variation, setVariation] = useState(_variation);
  // const [period,setPeriod] = useState('1d');

  useEffect(() => {
    async function getData(){
      const _data = await fetchData();
      // const _data = mock_data2;
      setData(_data)
      // console.log(_data)
      const {_double,_asymm,_variation} = processPeriodData(_data,'1d');
      if (_data.double.length!=0){
        setDouble(_double)
      }
      if (_data.asymm.length!=0){
        setAsymm(_asymm)
      }
      if (_data.variation.length!=0){
        setVariation(_variation)
      }
    }
    getData()
  }, []);
  
  // const {_double,_asymm,_variation} = processData(mock_data);
  // let {_double,_asymm,_variation} = processData(data);

  // let mock_data = {
  //   labels: ["January", "February", "March", "April", "May"],
  //   datasets: [
  //     {
  //       data: [
  //         Math.random() * 100,
  //         Math.random() * 100,
  //         Math.random() * 100,
  //         Math.random() * 100,
  //         Math.random() * 100,
  //         Math.random() * 100
  //       ]
  //     }
  //   ]
  // }

  const changePeriod = (period) => {
    // setPeriod('1w')
    const {_double,_asymm,_variation} = processPeriodData(data,period);
    setDouble(_double)
    setAsymm(_asymm)
    setVariation(_variation)
  }

  return (
    <ScrollView>
      <View style={{ flexDirection: "row" ,marginLeft: 20, justifyContent: 'space-evenly' }}>
        <TouchableWithoutFeedback onPress={()=>{
          changePeriod('1m');
        }
        }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>1 Minute</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={()=>{
          changePeriod('1h');
        }
        }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>1 Hour</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={()=>{
          changePeriod('1d');
        }
        }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>1 Day</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={()=>{
          changePeriod('1M');
        }
        }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>1 Month</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, textAlign: 'center', marginTop: 20 }}>双脚支撑占比</Text>
        <BeizerLine data={double}></BeizerLine>
        <Text style={{ fontSize: 20, textAlign: 'center', marginTop: 20 }}>步态不对称性</Text>
        <BeizerLine data={asymm}></BeizerLine>
        <Text style={{ fontSize: 20, textAlign: 'center', marginTop: 20 }}>摆动期变异性</Text>
        <BeizerLine data={variation}></BeizerLine>
      </View>
    </ScrollView>
  );
};

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

export default DataScreen;
