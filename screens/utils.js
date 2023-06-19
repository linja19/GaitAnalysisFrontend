import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const url = 'https://gaitanalysisthu.pythonanywhere.com/api';
// const url = 'http://183.172.164.155:8000/api';


function createToken(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export async function getOrCreateToken() {
    let token = await SecureStore.getItemAsync('token');
    if (token == null) {
        token = createToken(10);
        console.log("create",token)
        await SecureStore.setItemAsync('token', token);
    }

    return token;
}

export async function fetchData(){
    const token = await getOrCreateToken()
    let _url = url + "/get-param/"+token
    try {
      const response = await axios.get(_url);
    //   console.log(response.data)
      return response.data
    //   setData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

export async function sendData(data,mode="normal"){
    const token = await getOrCreateToken()
    let _url = url
    if (mode=="normal"){
        _url += "/upload-data/"
    }else{
        _url += "/upload-template/"
    }
    _url += token
    console.log(_url)
    try {
        const response = await axios.post(_url, data);
        console.log(response.data);
        console.log("Send Data",data.length)
        return response.data
    } catch (error) {
        console.error(error);
    }
}

export function mergeData(data1,data2,interval) {
    // console.log(data1)
    if (data1.length==0||data2.length==0){
        return []
    }
    // let first = data1[0].t<data2[0].t?data1[0]:data2[0]
    let first = data1[0]
    let firstTime = first.t
    // let last = data1[data1.length-1].t>data2[data2.length-1].t?data1[data1.length-1]:data2[data2.length-1]
    let last = data1[data1.length-1]
    let lastTime = last.t
    let merge = [];
    let t=firstTime+interval;
    let i = 1;
    let j = 2;
    while(t<lastTime){
        while(data1[i].t<t){
            i += 1
        }
        while((data2[j].t<t)&&(j<data2.length-1)){
            j += 1
        }
        // console.log("i",i)
        // console.log("t",t)
        // console.log("data1[i-1]",data1[i-1])
        let d0 = data1[i-1];
        let d1 = data1[i];
        let x = linearlize(d0.x,d1.x,d0.t,d1.t,t);
        let y = linearlize(d0.y,d1.y,d0.t,d1.t,t);
        let z = linearlize(d0.z,d1.z,d0.t,d1.t,t);

        let g0 = data2[j-1];
        let g1 = data2[j];
        let g_x = linearlize(g0.x,g1.x,g0.t,g1.t,t);
        let g_y = linearlize(g0.y,g1.y,g0.t,g1.t,t);
        let g_z = linearlize(g0.z,g1.z,g0.t,g1.t,t);

        merge.push({
            t:t,
            X:x,
            Y:y,
            Z:z,
            gX:g_x,
            gY:g_y,
            gZ:g_z
        })
        // i -= 1;
        t += interval
    }
    // console.log(merge)
    return merge;
}

function linearlize(x0,x1,t0,t1,t){
    let result = x0 + (t-t0)/(t1-t0)*(x1-x0);
    return result;
}

export function data2String (data){
    let string = "";
    for (let i = 0; i < data.length; i++) {
      string += data[i].t.toString() + " "
        + data[i].x.toPrecision(4).toString() + " "
        + data[i].y.toPrecision(4).toString() + " "
        + data[i].z.toPrecision(4).toString() + " "
        + data[i].gx.toPrecision(4).toString() + " "
        + data[i].gy.toPrecision(4).toString() + " "
        + data[i].gz.toPrecision(4).toString() + "\n"
    }
    return string;
}

export function process(data){
    let labels = []
    let datasetsData = []
    for (let i=0; i<data.length;i++){
        labels.push(data[i].date)
        datasetsData.push(data[i].value)
    }
    return {
        labels:labels,
        datasets:[{
            data:datasetsData
        }]
    }
}
// [
//     { "timestamp":"1680163635","value":25 },
//     { "timestamp":"1680239235","value":27.5 },
//     { "timestamp":"1680253635","value":26 },
//     { "timestamp":"1680340035","value":26.5 },
//     { "timestamp":"1680415635","value":24.5 },
// ]
const periodsMap = {
    '1m': 60,
    '1h': 60 * 60,
    '6h': 60 * 60 * 6,
    '12h': 60 * 60 * 12,
    '1d': 60 * 60 * 24,
    '1w': 60 * 60 * 24 * 7,
    '1M': 60 * 60 * 24 * 30,
}
function timestamp2date(timestamp,period,pref){
    // console.log(timestamp)
    // let date = new Date(timestamp*1000)
    // console.log(date.getMonth())
    // return timestamp
    let date = new Date(timestamp*1000)
    // console.log(date)
    const month = date.getMonth()+1
    // console.log(month)
    const day = date.getDate()
    const hour = date.getHours()
    let _pref = ''
    let _suff = ''
    if (period<=60*60*12){
        _pref = month+"/"+day
        _suff = " "+hour+":00"
    }else{
        _pref = month+"/"
        _suff = day
    }
    if (_pref==pref){
        return ["",_suff]
    }else{
        return [_pref,_suff]
    }
}
function processPeriod(data,period){
    let labels = []
    let datasetsData = []
    // console.log(data)
    let start = Number(data[0].timestamp)
    let end = Number(data[data.length-1].timestamp)
    let current = start
    // console.log(current,end)
    // console.log(period)
    let i = 0
    // console.log(Number(current)+period)
    let pref = ""
    let suff = ""
    // let suff = ''
    while(current<end){
        let sum = 0
        let count = 0
        // console.log("i",i)
        // console.log(data[i].timestamp)
        while((i<data.length)&&(data[i].timestamp<current+period)){
            sum += Number(data[i].value)
            count += 1
            i += 1
        }
        if (count!=0){
            [pref,suff] = timestamp2date(current,period,pref)
            // suff = timestamp2date(current,period,pref).suff
            console.log(pref,suff)
            labels.push(pref+suff)
            datasetsData.push(sum/count)
        }
        // console.log(current)
        current += period
    }
    return {
        labels:labels,
        datasets:[{
            data:datasetsData
        }]
    }
}
export function processPeriodData(data,period='1h'){
    let _period = periodsMap[period]
    // console.log(data.asymm)
    const _double = processPeriod(data.double,_period);
    const _asymm = processPeriod(data.asymm,_period);
    const _variation = processPeriod(data.variation,_period);
    // console.log(_double)
    return {
        _double,
        _asymm,
        _variation
    }
}

export function processData(data){
    // console.log(data)
    const _double = process(data.double);
    const _asymm = process(data.asymm);
    const _variation = process(data.variation);
    return {
        _double,
        _asymm,
        _variation
    }
}