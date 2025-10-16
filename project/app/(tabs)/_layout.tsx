import { Tabs } from 'expo-router';
import { Home, MessageCircle, Plus, Users, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useMessage } from '@/contexts/MessageContext';

export default function TabLayout() {
  const { unreadMessageCount } = useMessage();

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#EF4444',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingBottom: 20,
            paddingTop: 5,
            height: 75,
            position: 'absolute',
            bottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Ana Sayfa',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Mesajlar',
            tabBarIcon: ({ size, color }) => (
              <View style={{ position: 'relative' }}>
                <MessageCircle size={size} color={color} />
                {unreadMessageCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}>
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="posts"
          options={{
            title: 'Prospektüs',
            tabBarIcon: ({ size, color }) => (
              <Plus size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="friend-requests"
          options={{
            title: 'Arkadaşlık İsteği',
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}