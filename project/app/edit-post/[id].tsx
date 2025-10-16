import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'genel' | 'vaka' | 'soru';
  created_at: string;
  updated_at: string;
}

export default function EditPostPage() {
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'genel' as 'genel' | 'vaka' | 'soru',
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      if (!user?.id || !id) {
        Alert.alert('Hata', 'Kullanıcı veya paylaşım bilgisi eksik');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        Alert.alert('Hata', 'Paylaşım bulunamadı veya düzenleme yetkiniz yok', [
          { text: 'Tamam', onPress: () => router.back() }
        ]);
        return;
      }
      
      setPost(data as Post);
      setFormData({
        title: data.title || '',
        content: data.content || '',
        post_type: (data.post_type as 'genel' | 'vaka' | 'soru') || 'genel',
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Hata', 'Paylaşım yüklenirken hata oluştu', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
    if (!user?.id || !id) {
      Alert.alert('Hata', 'Kullanıcı veya paylaşım bilgisi bulunamadı');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('Hata', 'Paylaşım içeriği boş olamaz');
      return;
    }

    // Only allow editing certain post types
    if (post && !['genel', 'vaka', 'soru'].includes(post.post_type)) {
      Alert.alert('Hata', 'Bu tür paylaşımlar düzenlenemez');
      return;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: formData.title || (formData.post_type === 'vaka' ? 'Vaka Paylaşımı' : 
                                   formData.post_type === 'soru' ? 'Soru' : 'Genel Paylaşım'),
          content: formData.content.trim(),
          post_type: formData.post_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      Alert.alert('Başarılı', 'Paylaşımınız güncellendi!', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Hata', 'Paylaşım güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const postTypes = [
    { id: 'genel', title: 'Genel Paylaşım', color: '#6B7280' },
    { id: 'vaka', title: 'Vaka Paylaşımı', color: '#DC2626' },
    { id: 'soru', title: 'Soru & Cevap', color: '#059669' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yükleniyor...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Paylaşım yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paylaşım Bulunamadı</Text>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paylaşımı Düzenle</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paylaşım Türü</Text>
          <View style={styles.postTypeContainer}>
            {postTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.postTypeButton,
                  formData.post_type === type.id && { backgroundColor: type.color },
                ]}
                onPress={() => setFormData({...formData, post_type: type.id as any})}
              >
                <Text
                  style={[
                    styles.postTypeText,
                    formData.post_type === type.id && styles.activePostTypeText,
                  ]}
                >
                  {type.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input (optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Başlık (İsteğe Bağlı)</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Paylaşım başlığı..."
            value={formData.title}
            onChangeText={(text) => setFormData({...formData, title: text})}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İçerik</Text>
          <TextInput
            style={styles.textInput}
            placeholder={
              formData.post_type === 'vaka'
                ? 'Vaka detaylarını paylaşın...'
                : formData.post_type === 'soru'
                ? 'Sorunuzu yazın...'
                : 'Paylaşmak istediğiniz içeriği yazın...'
            }
            value={formData.content}
            onChangeText={(text) => setFormData({...formData, content: text})}
            multiline
            numberOfLines={8}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSavePost}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Text>
        </TouchableOpacity>
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
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  postTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  postTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activePostTypeText: {
    color: '#FFFFFF',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 200,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});