import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, MessageCircle, Briefcase, Users, Shield } from 'lucide-react-native';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    messages: true,
    friendRequests: true,
    jobAlerts: true,
    systemNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = () => {
    Alert.alert('Başarılı', 'Bildirim ayarlarınız kaydedildi!');
  };

  const notificationOptions = [
    {
      id: 'messages',
      title: 'Mesaj Bildirimleri',
      subtitle: 'Yeni mesaj geldiğinde bildirim al',
      icon: MessageCircle,
      value: settings.messages,
    },
    {
      id: 'friendRequests',
      title: 'Arkadaşlık İstekleri',
      subtitle: 'Yeni arkadaşlık isteği geldiğinde bildirim al',
      icon: Users,
      value: settings.friendRequests,
    },
    {
      id: 'jobAlerts',
      title: 'İş İlanı Bildirimleri',
      subtitle: 'Branşınıza uygun yeni iş ilanları için bildirim al',
      icon: Briefcase,
      value: settings.jobAlerts,
    },
    {
      id: 'systemNotifications',
      title: 'Sistem Bildirimleri',
      subtitle: 'Uygulama güncellemeleri ve duyurular',
      icon: Bell,
      value: settings.systemNotifications,
    },
    {
      id: 'emailNotifications',
      title: 'E-posta Bildirimleri',
      subtitle: 'Önemli bildirimler e-posta ile gönderilsin',
      icon: Shield,
      value: settings.emailNotifications,
    },
    {
      id: 'pushNotifications',
      title: 'Push Bildirimleri',
      subtitle: 'Telefon bildirimlerini etkinleştir',
      icon: Bell,
      value: settings.pushNotifications,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <Bell size={32} color="#EF4444" />
          </View>
          <Text style={styles.title}>Bildirim Tercihleri</Text>
          <Text style={styles.subtitle}>
            Hangi bildirimleri almak istediğinizi seçin
          </Text>
        </View>

        {/* Notification Options */}
        <View style={styles.optionsContainer}>
          {notificationOptions.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionInfo}>
                <View style={styles.optionIconContainer}>
                  <option.icon size={20} color="#EF4444" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={option.value}
                onValueChange={() => handleToggle(option.id as keyof typeof settings)}
                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                thumbColor={option.value ? '#EF4444' : '#9CA3AF'}
              />
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Ayarları Kaydet</Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Bildirim Hakkında</Text>
          <Text style={styles.infoText}>
            • Bildirimleri istediğiniz zaman açıp kapatabilirsiniz
            {'\n'}• E-posta bildirimleri sadece kritik durumlar için gönderilir
            {'\n'}• Push bildirimleri telefon ayarlarınızdan da kontrol edilebilir
            {'\n'}• Sistem bildirimleri güvenlik güncellemeleri içerir
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 18,
  },
});