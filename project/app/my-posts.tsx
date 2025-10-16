import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, CreditCard as Edit, Trash2, MoveVertical as MoreVertical } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MyPost {
  id: string;
  title: string;
  content: string;
  post_type: 'genel' | 'vaka' | 'soru';
  created_at: string;
  updated_at: string;
}

export default function MyPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as MyPost[]);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      Alert.alert('Hata', 'Paylaşımlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string, postTitle: string) => {
    Alert.alert(
      'Paylaşımı Sil',
      `"${postTitle}" başlıklı paylaşımınızı silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .update({ 
                  deleted_at: new Date().toISOString(),
                  deleted_by: user?.id 
                })
                .eq('id', postId);

              if (error) throw error;

              Alert.alert('Başarılı', 'Paylaşımınız silindi');
              fetchMyPosts(); // Refresh posts
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Hata', 'Paylaşım silinirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const editPost = (postId: string) => {
    router.push(`/edit-post/${postId}`);
  };

  const showPostOptions = (post: MyPost) => {
    Alert.alert(
      'Paylaşım İşlemleri',
      `"${post.title}" başlıklı paylaşımınız`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Düzenle', 
          onPress: () => editPost(post.id)
        },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deletePost(post.id, post.title)
        }
      ]
    );
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'vaka': return '#DC2626';
      case 'soru': return '#059669';
      default: return '#6B7280';
    }
  };

  const getPostTypeText = (type: string) => {
    switch (type) {
      case 'vaka': return 'Vaka';
      case 'soru': return 'Soru';
      default: return 'Genel';
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPostItem = ({ item }: { item: MyPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postMeta}>
          <View style={[styles.postTypeTag, { backgroundColor: getPostTypeColor(item.post_type) }]}>
            <Text style={styles.postTypeText}>{getPostTypeText(item.post_type)}</Text>
          </View>
          <Text style={styles.postDate}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => showPostOptions(item)}
        >
          <MoreVertical size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>
      
      <View style={styles.postFooter}>
        <Text style={styles.postTime}>
          {new Date(item.created_at).toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        {item.updated_at !== item.created_at && (
          <Text style={styles.editedText}>Düzenlendi</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paylaşımlarım</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Paylaşımlarımda ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Posts Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredPosts.length} paylaşım
        </Text>
      </View>

      {/* Posts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Paylaşımlar yükleniyor...</Text>
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'Paylaşım Bulunamadı' : 'Henüz Paylaşımınız Yok'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery 
              ? 'Arama kriterlerinize uygun paylaşım bulunamadı.' 
              : 'Prospektüs sekmesinden yeni paylaşımlar oluşturabilirsiniz.'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => router.push('/(tabs)/posts')}
            >
              <Text style={styles.createPostButtonText}>Paylaşım Oluştur</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          style={styles.postsList}
          contentContainerStyle={styles.postsContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createPostButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postsList: {
    flex: 1,
  },
  postsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  postTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  moreButton: {
    padding: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  editedText: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },
});