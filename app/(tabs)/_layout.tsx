import { Tabs } from 'expo-router';
import MyCustomTabBar from '../components/my-custom-tabbar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      // WICHTIG: Hier CustomTabBar einsetzen
      tabBar={(props) => <MyCustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="(journal)"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          lazy: true,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
