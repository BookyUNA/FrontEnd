/**
 * FrontBooky - App de Gestión de Citas
 * Sistema de reservas para profesionales independientes
 * 
 * @format
 */

import React from 'react';
import { LoginScreen } from './src/screens/auth/LoginScreen';

function App(): React.JSX.Element {
  // Por ahora mostramos directamente la pantalla de login
  // Posteriormente aquí agregarías tu navegación
  return <LoginScreen navigation={null} />;
}

export default App;