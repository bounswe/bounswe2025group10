import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [screen, setScreen] = useState('Login');
  const navigation = {
    navigate: to => setScreen(to),
    replace: to  => setScreen(to),
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {screen === 'Login' && <LoginScreen navigation={navigation} />}
      {screen === 'Signup' && <SignupScreen navigation={navigation} />}
      {screen === 'Home'   && <HomeScreen />}
    </SafeAreaView>
  );
}
