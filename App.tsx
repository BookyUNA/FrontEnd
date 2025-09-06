/**
 * FrontBooky - App de Gestión de Citas
 * Sistema de reservas para profesionales independientes
 *
 * @format
 */
import 'react-native-gesture-handler';
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { RegisterScreen } from "./src/screens/user/RegisterScreen";
import { EmailVerificationScreen } from "./src/screens/user/EmailVerificationScreen";
import { HomeScreen } from "./src/screens/main/HomeScreen";
import { ForgotPasswordScreen } from "./src/screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./src/screens/auth/ResetPasswordScreen";
import { CreateServiceScreen } from "./src/screens/services/CreateServiceScreen";
import { EditServiceScreen } from "./src/screens/services/EditServiceScreen";

import { authService } from "./src/services/auth/authService";
import { SafeContainer } from "./src/components/ui/SafeContainer";
import { colors } from "./src/styles/colors";
import { typography } from "./src/styles/typography";

// Tipos de navegación actualizados
export type RootStackParamList = {
  Login: { email?: string; verified?: boolean } | undefined;
  Register: undefined;
  EmailVerification: { email?: string; fromRegister?: boolean } | undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Home: undefined;
  CreateService: undefined;
  EditService: { service: any } | undefined;
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
          <>
            {/* Pantalla principal - Home con navegación bottom tabs */}
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {(props) => (
                <HomeScreen 
                  {...props} 
                  onLogout={() => setIsAuthenticated(false)} 
                />
              )}
            </Stack.Screen>

            {/* Pantalla de crear servicio */}
            <Stack.Screen 
              name="CreateService" 
              component={CreateServiceScreen}
              options={{ 
                title: "Crear Servicio",
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.primary.main,
                headerTitleStyle: {
                  ...typography.styles.h2,
                  color: colors.text.primary,
                },
              }}
            />

            {/* Pantalla de editar servicio */}
            <Stack.Screen 
              name="EditService" 
              component={EditServiceScreen}
              options={{ 
                title: "Editar Servicio",
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.primary.main,
                headerTitleStyle: {
                  ...typography.styles.h2,
                  color: colors.text.primary,
                },
              }}
            />
          </>
        ) : (
          <>
            {/* Pantalla de login */}
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => setIsAuthenticated(true)}
                />
              )}
            </Stack.Screen>
            
            {/* Pantalla de registro */}
            <Stack.Screen 
              name="Register" 
              options={{ 
                headerShown: true,
                title: "Crear Cuenta",
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.primary.main,
                headerTitleStyle: {
                  ...typography.styles.h2,
                  color: colors.text.primary,
                },
              }}
            >
              {(props) => (
                <RegisterScreen
                  {...props}
                  onRegisterSuccess={() => {
                    console.log('Registro completado exitosamente');
                  }}
                />
              )}
            </Stack.Screen>

            {/* Pantalla de verificación de correo */}
            <Stack.Screen 
              name="EmailVerification" 
              options={{ 
                headerShown: true,
                title: "Verificar Correo",
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.primary.main,
                headerTitleStyle: {
                  ...typography.styles.h2,
                  color: colors.text.primary,
                },
              }}
            >
              {(props) => (
                <EmailVerificationScreen
                  {...props}
                  onVerificationSuccess={() => {
                    console.log('Correo verificado exitosamente');
                  }}
                />
              )}
            </Stack.Screen>
            
            {/* Pantalla de recuperar contraseña */}
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ 
                title: "Recuperar Contraseña",
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.primary.main,
                headerTitleStyle: {
                  ...typography.styles.h2,
                  color: colors.text.primary,
                },
              }}
            />
            
            {/* Pantalla de resetear contraseña */}
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ 
                title: "Nueva Contraseña",
                headerStyle: {
                  backgroundColor: colors.background.primary,
                },
                headerTintColor: colors.primary.main,
                headerTitleStyle: {
                  ...typography.styles.h2,
                  color: colors.text.primary,
                },
              }}
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