import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { HealthProvider } from './src/context/HealthContext';
import { QuranBookmarkProvider } from './src/context/QuranBookmarkContext';
import TabBarIcon from './src/components/TabBarIcon';
import { COLORS } from './src/constants/colors';

import OnboardingFlow  from './src/screens/OnboardingFlow';
import HomeScreen      from './src/screens/HomeScreen';
import PrayersScreen   from './src/screens/PrayersScreen';
import QuranScreen     from './src/screens/QuranScreen';
import ZikarListScreen from './src/screens/ZikarListScreen';
import ZikarScreen     from './src/screens/ZikarScreen';
import SadaqaScreen    from './src/screens/SadaqaScreen';
import JourneyScreen   from './src/screens/JourneyScreen';
import SettingsScreen  from './src/screens/SettingsScreen';

import { scheduleAzanNotifications } from './src/utils/prayerTimes';
import { getLastScheduled } from './src/storage/azanStorage';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab        = createBottomTabNavigator();
const HomeStack  = createStackNavigator();
const ZikarStack = createStackNavigator();
const RootStack  = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain"  component={HomeScreen}     />
      <HomeStack.Screen name="Journey"   component={JourneyScreen}  />
      <HomeStack.Screen name="Settings"  component={SettingsScreen} />
    </HomeStack.Navigator>
  );
}

function ZikarStackNavigator() {
  return (
    <ZikarStack.Navigator screenOptions={{ headerShown: false }}>
      <ZikarStack.Screen name="ZikarList"    component={ZikarListScreen} />
      <ZikarStack.Screen name="ZikarCounter" component={ZikarScreen}     />
    </ZikarStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.parchment,
          borderTopColor: 'rgba(139,118,214,0.22)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor:   COLORS.sage,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 1 },
        tabBarIcon: ({ color }) => (
          <TabBarIcon name={route.name.toLowerCase()} color={color} size={22} />
        ),
      })}
    >
      <Tab.Screen name="Home"    component={HomeStackNavigator} options={{ tabBarLabel: 'Home'    }} />
      <Tab.Screen name="Prayers" component={PrayersScreen}      options={{ tabBarLabel: 'Prayers' }} />
      <Tab.Screen name="Quran"   component={QuranScreen}        options={{ tabBarLabel: 'Quran'   }} />
      <Tab.Screen name="Zikar"   component={ZikarStackNavigator} options={{ tabBarLabel: 'Zikar'   }} />
      <Tab.Screen name="Sadaqa"  component={SadaqaScreen}       options={{ tabBarLabel: 'Sadaqa'  }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { settings, isLoaded } = useSettings();

  // Reschedule azan notifications if stale (> 24h since last schedule)
  useEffect(() => {
    if (!isLoaded || !settings?.azan?.enabled || !settings?.azan?.latitude) return;
    async function maybeReschedule() {
      const last = await getLastScheduled();
      if (!last) {
        scheduleAzanNotifications(settings.azan);
        return;
      }
      const msAgo = Date.now() - new Date(last).getTime();
      if (msAgo > 24 * 60 * 60 * 1000) {
        scheduleAzanNotifications(settings.azan);
      }
    }
    maybeReschedule();
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.parchment }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      {settings?.onboardingDone ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Onboarding" component={OnboardingFlow} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <HealthProvider>
          <QuranBookmarkProvider>
            <NavigationContainer>
              <StatusBar style="dark" backgroundColor={COLORS.parchment} />
              <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.parchment }}>
                <RootNavigator />
              </SafeAreaView>
            </NavigationContainer>
          </QuranBookmarkProvider>
        </HealthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
