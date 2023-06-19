import { createAppContainer } from 'react-navigation';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from 'react-navigation-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import DataScreen from './screens/DataScreen';
import ExperimentScreen from './screens/ExperimentScreen';
import NormalScreen from './screens/NormalScreen';

// const AppNavigator = createStackNavigator(
//   {
//     Home: {
//       screen: HomeScreen,
//       navigationOptions: {
//         title: 'Home',
//       },
//     },
//     Chart: {
//       screen: DataScreen,
//       navigationOptions: {
//         title: 'Chart',
//       },
//     },
//   },
//   {
//     initialRouteName: 'Home',
//   }
// );

// export default createAppContainer(AppNavigator);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* <Stack.Screen name="Data" component={DataScreen} /> */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Data" component={DataScreen} />
        <Stack.Screen name="Experiment" component={ExperimentScreen} />
        <Stack.Screen name="Normal" component={NormalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

