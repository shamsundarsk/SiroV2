import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import Colors from "@/constants/colors";
import { AppProvider, useApp } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen is already handled
});

const queryClient = new QueryClient();

function VoiceAgentModal() {
  const { voiceAgentActive, dismissVoiceAgent, stopTimer, userProfile } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  if (!voiceAgentActive) return null;

  const name = userProfile?.name?.split(" ")[0] || "there";

  return (
    <Modal
      visible={voiceAgentActive}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={voiceStyles.overlay}>
        <View style={[voiceStyles.card, { backgroundColor: theme.surface }]}>
          <View style={voiceStyles.callAnim}>
            <View style={[voiceStyles.callOuter, { backgroundColor: Colors.primary + "22" }]}>
              <View style={[voiceStyles.callInner, { backgroundColor: Colors.primary + "44" }]}>
                <View style={[voiceStyles.callCore, { backgroundColor: Colors.primary }]}>
                  <Text style={voiceStyles.callEmoji}>📞</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={[voiceStyles.caller, { color: theme.textSecondary }]}>WorkTrack AI Agent</Text>
          <Text style={[voiceStyles.callLabel, { color: theme.text }]}>Incoming Call</Text>

          <View style={[voiceStyles.messageBox, { backgroundColor: Colors.warning + "18", borderColor: Colors.warning + "40" }]}>
            <Text style={[voiceStyles.message, { color: theme.text }]}>
              Hey {name}! 👋 Your timer is still running but you've been away from the app. Looks like you might be procrastinating — it's time to get back to work!
            </Text>
          </View>

          <View style={voiceStyles.btnRow}>
            <Pressable
              style={[voiceStyles.dismissBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              onPress={dismissVoiceAgent}
            >
              <Text style={[voiceStyles.dismissText, { color: theme.text }]}>I'm Back 👍</Text>
            </Pressable>
            <Pressable
              style={[voiceStyles.stopTimerBtn, { backgroundColor: "#EF4444" }]}
              onPress={() => { dismissVoiceAgent(); stopTimer(); }}
            >
              <Text style={voiceStyles.stopTimerText}>Stop Timer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { userProfile } = useApp();

  if (!userProfile || !userProfile.onboarded) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
        </Stack>
        <Redirect href="/onboarding" />
      </>
    );
  }

  return (
    <>
      {children}
      <VoiceAgentModal />
    </>
  );
}

function RootLayoutNav() {
  return (
    <OnboardingGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="timer-running"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="new-entry"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="edit-entry"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="new-project"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.5],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="new-task"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </OnboardingGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const voiceStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 16,
    maxWidth: 380,
  },
  callAnim: { alignItems: "center", justifyContent: "center", marginTop: 8 },
  callOuter: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  callInner: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  callCore: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  callEmoji: { fontSize: 24 },
  caller: { fontSize: 13, fontFamily: "Inter_500Medium" },
  callLabel: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: -8 },
  messageBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    width: "100%",
  },
  message: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center" },
  btnRow: { flexDirection: "row", gap: 10, width: "100%" },
  dismissBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  dismissText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  stopTimerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  stopTimerText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
