// App.tsx
/**
 * FrontBooky - App de Gestión de Citas
 * Sistema de reservas para profesionales independientes
 * Actualizado con manejo de estado de autenticación y navegación
 *
 * @format
 */
import 'react-native-gesture-handler';
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { HomeScreen } from "./src/screens/main/HomeScreen";
import { ForgotPasswordScreen } from "./src/screens/auth/ForgotPasswordScreen";

import { authService } from "./src/services/auth/authService";
import { SafeContainer } from "./src/components/ui/SafeContainer";
import { colors } from "./src/styles/colors";
import { typography } from "./src/styles/typography";

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      console.log("Verificando estado de autenticación...");
      const isUserAuthenticated = await authService.isAuthenticated();
      setIsAuthenticated(isUserAuthenticated);
      console.log(
        "Estado de autenticación:",
        isUserAuthenticated ? "Autenticado" : "No autenticado"
      );
    } catch (error) {
      console.error("Error al verificar autenticación:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="Home" options={{ headerShown: false }}>
            {(props) => (
              <HomeScreen {...props} onLogout={() => setIsAuthenticated(false)} />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => setIsAuthenticated(true)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: "Recuperar Contraseña" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
});

export default App;
