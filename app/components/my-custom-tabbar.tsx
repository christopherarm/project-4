import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Home, User, Trophy, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 48;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

export default function MyCustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const tabAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabAnimatedValue, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [state.index]);

  const translateX = tabAnimatedValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3],
  });

  return (
    <View
      style={[styles.container, { bottom: insets.bottom + 24 }]}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX }],
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          let Icon = Home;
          if (route.name === '(journal)') Icon = Home;
          if (route.name === 'map') Icon = MapPin;
          if (route.name === 'achievements') Icon = Trophy;
          if (route.name === 'profile') Icon = User;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Icon
                size={24}
                color={isFocused ? '#2563EB' : '#94A3B8'}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? '#2563EB' : '#94A3B8' },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 64,
    zIndex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.98)',
      android: '#FFFFFF',
      default: '#FFFFFF',
    }),
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: 64,
    backgroundColor: '#EFF6FF',
    zIndex: -1,
  },
  tab: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },
});
