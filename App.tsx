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
import { colors } from "./src/styles/colors";
import { typography } from "./src/styles/typography";

import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { RegisterScreen } from "./src/screens/user/RegisterScreen";
import { EmailVerificationScreen } from "./src/screens/user/EmailVerificationScreen";
import { HomeScreen } from "./src/screens/main/HomeScreen";
import { ForgotPasswordScreen } from "./src/screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./src/screens/auth/ResetPasswordScreen";
import { ClientAppointmentsScreen } from "./src/screens/client/ClientAppointmentsScreen";
import { ProfessionalAppointmentsScreen } from "./src/screens/client/ProfessionalAppointmentsScreen";
import { ProfileScreen } from "./src/screens/profile/ProfileScreen";
import { CreateServiceScreen } from "./src/screens/services/CreateServiceScreen";
import { EditServiceScreen } from "./src/screens/services/EditServiceScreen";
import { ProfessionalServicesScreen } from "./src/screens/client/ProfessionalServicesScreen";
import { PlanSelectionScreen } from "./src/screens/subscription/PlanSelectionScreen";
import { PaymentGatewayScreen } from "./src/screens/subscription/PaymentGatewayScreen";
import { RescheduleAppointmentScreen } from "./src/screens/client/RescheduleAppointmentScreen";

import { authService } from "./src/services/auth/authService";
import { SafeContainer } from "./src/components/ui/SafeContainer";

export type RootStackParamList = {
  Login: { email?: string; verified?: boolean } | undefined;
  Register: undefined;
  EmailVerification: { email?: string; fromRegister?: boolean } | undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Home: undefined;
  CreateService: undefined;
  EditService: { service: any } | undefined;
  ProfessionalServices: undefined;
  PlanSelection: undefined;
  PaymentGateway: { plan: { id: string; name: string; price: string; color: string } } | undefined;
  RescheduleAppointment: { appointment: any } | undefined;
  ClientAppointments: undefined;
  Profile: undefined;
  ProfessionalAppointments: undefined;
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
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {(props) => (
                <HomeScreen 
                  {...props} 
                  onLogout={() => setIsAuthenticated(false)} 
                />
              )}
            </Stack.Screen>

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

            <Stack.Screen 
              name="ProfessionalServices" 
              component={ProfessionalServicesScreen}
              options={{ 
                title: "Servicios Profesionales",
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

            <Stack.Screen 
              name="PlanSelection" 
              component={PlanSelectionScreen}
              options={{ 
                title: "Planes de Suscripción",
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

            <Stack.Screen 
              name="PaymentGateway" 
              component={PaymentGatewayScreen}
              options={{ 
                title: "Pasarela de Pago",
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

            <Stack.Screen 
              name="RescheduleAppointment" 
              component={RescheduleAppointmentScreen}
              options={{ 
                title: "Reprogramar Cita",
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

            <Stack.Screen 
              name="ClientAppointments" 
              component={ClientAppointmentsScreen}
              options={{ 
                title: "Mis Citas",
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

            <Stack.Screen 
              name="ProfessionalAppointments" 
              component={ProfessionalAppointmentsScreen}
              options={{ 
                title: "Citas",
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

            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ 
                title: "Mi Perfil",
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
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => setIsAuthenticated(true)}
                />
              )}
            </Stack.Screen>
            
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