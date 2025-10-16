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
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Plus, Search, MessageCircle, Heart, Share, MoveVertical as MoreVertical, Trash2, CreditCard as Edit, Eye, User, Calendar, Filter, X, Camera, ImageIcon as ImagePlus, FileText, BarChart3, Users, Shield, UserX } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isValidDateString, isValidTimeString, isDateInFuture, handleSupabaseError, isValidDDMMYYYYDate, isDateInFutureDDMMYYYY, convertDDMMYYYYToDate, formatPostDateTime } from '@/lib/utils';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import * as ImagePicker from 'expo-image-picker';

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'genel' | 'vaka' | 'soru' | 'etkinlik' | 'anket';
  media_urls: string[];
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    branch: string;
    avatar_url: string | null;
    role: string;
  };
  comments_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  survey_response_count?: number;
  // Event fields
  event_date?: string;
  event_time?: string;
  event_location?: string;
  max_participants?: number;
  registration_deadline?: string;
  // Survey fields
  questions?: Question[];
}

interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating';
  question: string;
  options?: string[];
  required?: boolean;
}

export default function PostsPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('all');
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Check if user is admin or moderator
  const isAdminOrModerator = profile?.role === 'admin' || profile?.role === 'moderator';

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'genel' as 'genel' | 'vaka' | 'soru' | 'etkinlik' | 'anket',
    media_urls: [] as string[],
    event_date: '',
    event_time: '',
    event_location: '',
    max_participants: '50',
    registration_deadline: '',
    questions: [] as Question[],
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState<{[key: string]: any}>({});

  const postTypes = [
    { id: 'all', title: 'Tümü', color: '#6B7280', icon: '📋' },
    { id: 'genel', title: 'Genel', color: '#6B7280', icon: '📝' },
    { id: 'vaka', title: 'Vaka', color: '#DC2626', icon: '🏥' },
    { id: 'soru', title: 'Soru', color: '#059669', icon: '❓' },
    { id: 'etkinlik', title: 'Etkinlik', color: '#7C3AED', icon: '📅' },
    { id: 'anket', title: 'Anket', color: '#F59E0B', icon: '📊' },
  ];

  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
      fetchPosts();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const fetchCurrentUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      setCurrentUserData(data);
    } catch (error) {
      console.error('Error fetching current user data:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          title,
          content,
          post_type,
          media_urls,
          created_at,
          updated_at,
          event_date,
          event_time,
          event_location,
          max_participants,
          registration_deadline,
          questions,
          is_approved,
          profiles!posts_user_id_fkey(
            first_name, 
            last_name, 
            branch, 
            avatar_url, 
            role,
            institution,
            city
          )
        `)
        .is('deleted_at', null)
        .eq('is_approved', true) // Only show approved posts
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('📝 Fetched posts:', data?.length || 0);
      console.log('📝 Sample post data:', data?.[0]);
      console.log('📝 Sample post profiles data:', data?.[0]?.profiles);
      
      // Fetch likes data for each post
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          try {
            // Get likes count
            const { count: likesCount, error: countError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            if (countError) {
              console.warn('Likes table not found, using default values:', countError.message);
              return {
                ...post,
                likes_count: 0,
                is_liked: false
              };
            }

            // Check if current user liked this post
            let userLike = null;
            if (user?.id) {
              const { data, error: userLikeError } = await supabase
                .from('likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user?.id || '')
                .maybeSingle();
              
              if (!userLikeError) {
                userLike = data;
              }
            }

            // Get survey response count for surveys
            let surveyResponseCount = 0;
            if (post.post_type === 'anket') {
              try {
                const { data: surveyData, error: surveyError } = await supabase
                  .from('survey_responses')
                  .select('user_id')
                  .eq('post_id', post.id);
                
                if (!surveyError && surveyData) {
                  // Count unique users who responded
                  const uniqueUsers = new Set(surveyData.map(r => r.user_id));
                  surveyResponseCount = uniqueUsers.size;
                }
              } catch (surveyError) {
                console.warn('⚠️ Error fetching survey responses:', surveyError);
              }
            }

            return {
              ...post,
              likes_count: likesCount || 0,
              is_liked: !!userLike,
              survey_response_count: surveyResponseCount
            };
          } catch (likeError) {
            console.error('Error fetching likes for post:', post.id, likeError);
            return {
              ...post,
              likes_count: 0,
              is_liked: false
            };
          }
        })
      );
      
        setPosts(postsWithLikes as unknown as Post[]);
        
        // Load user's survey responses for all survey posts
        await loadUserSurveyResponses(postsWithLikes);
        
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSurveyResponses = async (posts: any[]) => {
    try {
      if (!user?.id) return;
      
      // Get all survey post IDs
      const surveyPostIds = posts
        .filter(post => post.post_type === 'anket')
        .map(post => post.id);
      
      if (surveyPostIds.length === 0) return;
      
      console.log('📊 Loading survey responses for posts:', surveyPostIds);
      
      // Fetch user's responses for all survey posts
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('post_id, question_index, selected_option, rating_value, answer_text')
        .eq('user_id', user.id)
        .in('post_id', surveyPostIds);
      
      if (responsesError) {
        console.error('❌ Error loading survey responses:', responsesError);
        return;
      }
      
      if (!responsesData || responsesData.length === 0) {
        console.log('ℹ️ No survey responses found for user');
        return;
      }
      
      // Convert responses to the format expected by the UI
      const responsesMap: { [key: string]: any } = {};
      
      responsesData.forEach(response => {
        const responseKey = `${response.post_id}_${response.question_index}`;
        
        if (response.selected_option) {
          responsesMap[responseKey] = response.selected_option;
        } else if (response.rating_value) {
          responsesMap[responseKey] = response.rating_value;
        } else if (response.answer_text) {
          responsesMap[responseKey] = response.answer_text;
        }
      });
      
      console.log('✅ Loaded survey responses:', responsesMap);
      setSurveyResponses(responsesMap);
      
    } catch (error) {
      console.error('❌ Error in loadUserSurveyResponses:', error);
    }
  };

  const handleImagePicker = async () => {
    try {
      console.log('📸 Starting image picker...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin verilmedi');
        return;
      }

      Alert.alert(
        'Görsel Seç',
        'Görsel seçmek için bir yöntem seçin:',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Kamera', onPress: openCamera },
          { text: 'Galeri', onPress: openGallery },
        ]
      );
    } catch (error) {
      console.error('Error in handleImagePicker:', error);
      Alert.alert('Hata', 'Görsel seçerken hata oluştu');
    }
  };

  const promptForImageUrl = () => {
    Alert.prompt(
      'Görsel URL',
      'Görsel URL\'sini girin:',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Ekle', 
          onPress: (url) => {
            if (url && url.trim()) {
              addImageFromUrl(url.trim());
            } else {
              Alert.alert('Hata', 'Geçerli bir URL girin');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const addImageFromUrl = async (imageUrl: string) => {
    try {
      console.log('📸 Adding image from URL:', imageUrl);
      
      // Validate URL
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        Alert.alert('Hata', 'Geçerli bir URL girin (http:// veya https:// ile başlamalı)');
        return;
      }

      // Add to media_urls directly
      setNewPost(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, imageUrl]
      }));
      
      Alert.alert('Başarılı', 'Görsel eklendi!');
      console.log('✅ Image added from URL');
    } catch (error) {
      console.error('Error adding image from URL:', error);
      Alert.alert('Hata', 'Görsel eklenirken hata oluştu');
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin gerekli');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Hata', 'Kamera açılırken hata oluştu');
    }
  };

  const openGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          await uploadImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Hata', 'Galeri açılırken hata oluştu');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploadingMedia(true);
      console.log('📸 Starting image upload:', imageUri);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const fileName = `post_${user.id}_${Date.now()}.jpg`;
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(`${user.id}/${fileName}`, formData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(`${user.id}/${fileName}`);

      if (urlData?.publicUrl) {
        setNewPost(prev => ({
          ...prev,
          media_urls: [...prev.media_urls, urlData.publicUrl]
        }));
        
        console.log('✅ Image uploaded successfully:', urlData.publicUrl);
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Fallback: use local URI
      console.log('⚠️ Upload failed, using local URI as fallback');
      setNewPost(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, imageUri]
      }));
      
      Alert.alert('Bilgi', 'Görsel yerel olarak eklendi. Paylaşım yapılabilir.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeImage = (index: number) => {
    setNewPost(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'multiple_choice',
      question: '',
      options: ['', ''],
      required: false,
    };
    setNewPost(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setNewPost(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const addOption = (questionId: string) => {
    setNewPost(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { 
          ...q, 
          options: [...(q.options || []), ''] 
        } : q
      )
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setNewPost(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? {
          ...q,
          options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt)
        } : q
      )
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setNewPost(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const currentOptions = q.options || [];
          // Don't allow removing if only 2 options left
          if (currentOptions.length <= 2) {
            Alert.alert('Uyarı', 'En az 2 seçenek bulunmalıdır');
            return q;
          }
          return {
          ...q,
            options: currentOptions.filter((_, idx) => idx !== optionIndex)
          };
        }
        return q;
      })
    }));
  };

  const removeQuestion = (questionId: string) => {
    setNewPost(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleCreatePost = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    // Content validation - skip for surveys as they don't need content
    if (newPost.post_type !== 'anket' && !newPost.content.trim()) {
      Alert.alert('Hata', 'Paylaşım içeriği boş olamaz');
      return;
    }

    // Validate event fields if post type is event
    if (newPost.post_type === 'etkinlik') {
      // Validate event date
      console.log('🔍 Validating event date format:', newPost.event_date);
      const isEventDateFormatValid = isValidDDMMYYYYDate(newPost.event_date);
      console.log('✅ Event date format validation result:', isEventDateFormatValid);
      
      if (!isEventDateFormatValid) {
        Alert.alert('Geçersiz Tarih', 'Etkinlik tarihi GG/AA/YYYY formatında olmalıdır (örn: 15/03/2025)');
        return;
      }

      // Validate event time if provided
      if (newPost.event_time) {
        console.log('🔍 Validating event time format:', newPost.event_time);
        const isTimeValid = isValidTimeString(newPost.event_time);
        console.log('✅ Event time format validation result:', isTimeValid);
        
        if (!isTimeValid) {
        Alert.alert('Geçersiz Saat', 'Etkinlik saati HH:MM formatında olmalıdır (örn: 14:30)');
        return;
        }
      }

      // Validate registration deadline
      console.log('🔍 Validating registration deadline format:', newPost.registration_deadline);
      const isDeadlineFormatValid = isValidDDMMYYYYDate(newPost.registration_deadline);
      console.log('✅ Registration deadline format validation result:', isDeadlineFormatValid);
      
      if (!isDeadlineFormatValid) {
        Alert.alert('Geçersiz Tarih', 'Kayıt son tarihi GG/AA/YYYY formatında olmalıdır (örn: 10/03/2025)');
        return;
      }

      // Check if dates are in the future
      console.log('🔍 Validating event date:', newPost.event_date, 'with time:', newPost.event_time);
      const isEventDateValid = isDateInFutureDDMMYYYY(newPost.event_date, newPost.event_time);
      console.log('✅ Event date validation result:', isEventDateValid);
      
      if (!isEventDateValid) {
        Alert.alert('Geçersiz Tarih', 'Etkinlik tarihi bugün veya gelecekte olmalıdır');
        return;
      }

      console.log('🔍 Validating registration deadline:', newPost.registration_deadline);
      const isDeadlineValid = isDateInFutureDDMMYYYY(newPost.registration_deadline);
      console.log('✅ Registration deadline validation result:', isDeadlineValid);
      
      if (!isDeadlineValid) {
        Alert.alert('Geçersiz Tarih', 'Kayıt son tarihi bugün veya gelecekte olmalıdır');
        return;
      }

      // Check if registration deadline is before event date
      const regDate = convertDDMMYYYYToDate(newPost.registration_deadline);
      const evtDate = convertDDMMYYYYToDate(newPost.event_date);
      if (regDate && evtDate && regDate >= evtDate) {
        Alert.alert('Geçersiz Tarih', 'Kayıt son tarihi etkinlik tarihinden önce olmalıdır');
        return;
      }
    }

    // Validate event fields
    if (newPost.post_type === 'etkinlik') {
      if (!newPost.event_date || !newPost.event_location || !newPost.registration_deadline) {
        Alert.alert('Hata', 'Etkinlik için tarih, konum ve kayıt son tarihi zorunludur');
        return;
      }
    }

    // Validate survey questions
    if (newPost.post_type === 'anket') {
      const validQuestions = newPost.questions.filter(q => q.question.trim());
      if (validQuestions.length === 0) {
        Alert.alert('Hata', 'Anket için en az bir soru eklemelisiniz');
        return;
      }

      // Validate each question
      for (let i = 0; i < validQuestions.length; i++) {
        const question = validQuestions[i];
        
        if (!question.question.trim()) {
          Alert.alert('Hata', `${i + 1}. soru boş olamaz`);
          return;
        }

        // Validate multiple choice options
        if (question.type === 'multiple_choice') {
          if (!question.options || question.options.length < 2) {
            Alert.alert('Hata', `${i + 1}. soru için en az 2 seçenek eklemelisiniz`);
            return;
          }

          const validOptions = question.options.filter(opt => opt.trim());
          if (validOptions.length < 2) {
            Alert.alert('Hata', `${i + 1}. soru için en az 2 geçerli seçenek eklemelisiniz`);
            return;
          }

          // Update question with only valid options
          question.options = validOptions;
        }
      }

      // Update newPost with validated questions
      newPost.questions = validQuestions;
    }

    try {
      const postContent = newPost.post_type === 'anket' ? '' : newPost.content.trim();
      const postTitle = newPost.title || (newPost.post_type === 'vaka' ? 'Vaka Paylaşımı' : 
                                   newPost.post_type === 'soru' ? 'Soru' : 
                                   newPost.post_type === 'etkinlik' ? 'Etkinlik' :
                                         newPost.post_type === 'anket' ? 'Anket' : 'Genel Paylaşım');

      console.log('📝 Creating post with data:', {
        user_id: user.id,
        title: postTitle,
        content: postContent,
          post_type: newPost.post_type,
          media_urls: newPost.media_urls,
      });

      // Prepare post data with event fields if it's an event
      const postInsertData: any = {
        user_id: user.id,
        title: postTitle,
        content: postContent,
        post_type: newPost.post_type,
        media_urls: newPost.media_urls,
      };

      // Add event fields to post if it's an event
      if (newPost.post_type === 'etkinlik') {
        postInsertData.event_date = newPost.event_date;
        postInsertData.event_time = newPost.event_time;
        postInsertData.event_location = newPost.event_location;
        postInsertData.max_participants = newPost.max_participants;
        postInsertData.registration_deadline = newPost.registration_deadline;
        postInsertData.is_approved = false; // Events require approval
        
        console.log('📅 Event data being saved:', {
          event_date: newPost.event_date,
          event_time: newPost.event_time,
          event_location: newPost.event_location,
          max_participants: newPost.max_participants,
          registration_deadline: newPost.registration_deadline,
          is_approved: false
        });
      } else {
        // Non-event posts are auto-approved
        postInsertData.is_approved = true;
      }

      // Add survey questions if it's a survey
      if (newPost.post_type === 'anket') {
        postInsertData.questions = newPost.questions;
      }

      console.log('📝 Creating post with data:', postInsertData);

      // Create post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert(postInsertData)
        .select()
        .single();

      if (postError) {
        console.error('❌ Post creation error:', postError);
        throw postError;
      }

      console.log('✅ Post created successfully:', postData);

      if (newPost.post_type === 'etkinlik') {
        Alert.alert('Başarılı', 'Etkinliğiniz oluşturuldu! Admin onayından sonra yayınlanacaktır.');
      } else {
        Alert.alert('Başarılı', 'Paylaşımınız oluşturuldu!');
      }
      setShowCreateModal(false);
      resetForm();
      
      // Refresh posts list
      console.log('🔄 Refreshing posts list...');
      await fetchPosts();
      console.log('✅ Posts list refreshed');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Hata', handleSupabaseError(error));
    }
  };

  const resetForm = () => {
    setNewPost({
      title: '',
      content: '',
      post_type: 'genel',
      media_urls: [],
      event_date: '',
      event_time: '',
      event_location: '',
      max_participants: '50',
      registration_deadline: '',
      questions: [],
    });
  };

  const deletePost = async (postId: string, postTitle: string) => {
    Alert.alert(
      'Paylaşımı Sil',
      `"${postTitle}" başlıklı paylaşımı silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting post:', postId);
              console.log('👤 Current user:', user?.id);
              console.log('👑 User role:', currentUserData?.role);
              console.log('🔐 Is admin/moderator:', isAdminOrModerator);
              
              // Check if user has permission
              if (!isAdminOrModerator) {
                Alert.alert('Yetki Hatası', 'Bu işlemi yapmak için admin veya moderatör yetkisi gereklidir');
                return;
              }
              
              // Test basic connection first
              console.log('🔍 Testing Supabase connection...');
              const { data: testData, error: testError } = await supabase
                .from('posts')
                .select('id')
                .limit(1);

              if (testError) {
                console.error('❌ Supabase connection test failed:', testError);
                throw testError;
              }

              console.log('✅ Supabase connection OK');

              // Check if post exists
              console.log('🔍 Checking if post exists...');
              const { data: postData, error: fetchError } = await supabase
                .from('posts')
                .select('id, user_id, title, deleted_at')
                .eq('id', postId)
                .maybeSingle();

              if (fetchError) {
                console.error('❌ Error fetching post:', fetchError);
                throw fetchError;
              }

              if (!postData) {
                Alert.alert('Hata', 'Paylaşım bulunamadı');
                return;
              }

              console.log('📄 Post details:', postData);

              if (postData.deleted_at) {
                Alert.alert('Bilgi', 'Bu paylaşım zaten silinmiş');
                return;
              }
              
              // Simple delete without related records first
              console.log('🗑️ Attempting simple delete...');
              const { error: deleteError } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

              if (deleteError) {
                console.error('❌ Supabase delete error:', deleteError);
                console.error('❌ Error details:', JSON.stringify(deleteError, null, 2));
                throw deleteError;
              }

              console.log('✅ Post deleted successfully');
              Alert.alert('Başarılı', 'Paylaşım silindi');
              fetchPosts();
            } catch (error) {
              console.error('❌ Error deleting post:', error);
              console.error('❌ Error details:', JSON.stringify(error, null, 2));
              const errorMessage = handleSupabaseError(error);
              Alert.alert('Hata', `Paylaşım silinirken hata oluştu: ${errorMessage}`);
            }
          }
        }
      ]
    );
  };

  // Admin/Moderator functions
  const handlePostAction = (post: Post) => {
    if (!isAdminOrModerator) return;
    
    setSelectedPost(post);
    setShowActionSheet(true);
  };

  const blockUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: true })
        .eq('id', userId);

      if (error) {
        console.error('Error blocking user:', error);
        Alert.alert('Hata', 'Kullanıcı engellenirken bir hata oluştu');
      } else {
        Alert.alert('Başarılı', `${userName} kullanıcısı engellendi`);
        fetchPosts(); // Refresh the list
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Hata', 'Kullanıcı engellenirken bir hata oluştu');
    }
  };

  const showBlockConfirmation = (post: Post) => {
    const userName = `${post.profiles?.first_name || 'Bilinmeyen'} ${post.profiles?.last_name || 'Kullanıcı'}`;
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${userName} kullanıcısını engellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Engelle', 
          style: 'destructive',
          onPress: () => blockUser(post.user_id, userName)
        }
      ]
    );
  };

  const handleSurveyResponse = async (postId: string, questionIndex: number, questionText: string, answer: any, answerType: 'option' | 'rating' | 'text') => {
    try {
      if (!user?.id) {
        Alert.alert('Hata', 'Anketi cevaplayabilmek için giriş yapmalısınız');
        return;
      }

      console.log('📊 Submitting survey response:', { postId, questionIndex, questionText, answer, answerType });

      const responseData: any = {
        post_id: postId,
        user_id: user.id,
        question_index: questionIndex,
        question_text: questionText,
      };

      console.log('📝 Response data being prepared:', responseData);

      // Set the appropriate answer field based on type
      switch (answerType) {
        case 'option':
          responseData.selected_option = answer;
          break;
        case 'rating':
          responseData.rating_value = answer;
          console.log('⭐ Saving rating response:', { answer, rating_value: answer, type: typeof answer });
          break;
        case 'text':
          responseData.answer_text = answer;
          break;
      }

      // Insert or update response - try both table names
      let error = null;
      let tableName = '';
      
      console.log('💾 Attempting to save to survey_responses table...');
      
      // Try to save to survey_responses table
      const { error: surveyError } = await supabase
        .from('survey_responses')
        .upsert(responseData, {
          onConflict: 'post_id,user_id,question_index'
        });
      
      if (surveyError) {
        console.log('⚠️ survey_responses failed:', surveyError.message);
        error = surveyError;
        tableName = 'survey_responses';
      } else {
        console.log('✅ Successfully saved to survey_responses table');
        error = null;
        tableName = 'survey_responses';
      }

      if (!error) {
        console.log(`✅ Successfully saved to ${tableName} table:`, responseData);
      }

      if (error) {
        console.error('❌ Error saving survey response:', error);
        
        // Check for RLS policy violation or table not found
        if (error.code === '42501' || error.code === 'PGRST204' || 
            error.message?.includes('row-level security policy') || 
            error.message?.includes('survey_responses')) {
          console.log('🔒 Survey system issue detected:', error.message);
          
          Alert.alert(
            'Anket Sistemi', 
            'Anket sistemi henüz kurulmamış. Lütfen admin ile iletişime geçin.\n\nCevabınız yerel olarak kaydedildi.',
            [
              { text: 'Tamam', style: 'default' }
            ]
          );
          
          // Save locally for now
          const responseKey = `${postId}_${questionIndex}`;
          setSurveyResponses(prev => ({
            ...prev,
            [responseKey]: answer
          }));
          return;
        } else {
          Alert.alert('Hata', 'Cevap kaydedilirken hata oluştu: ' + error.message);
          return;
        }
      }

      console.log('✅ Survey response saved successfully');
      
      // Refresh posts to update survey response counts
      fetchPosts();
      
    } catch (error) {
      console.error('Error handling survey response:', error);
      Alert.alert('Hata', 'Cevap kaydedilirken hata oluştu');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      if (!user?.id) {
        Alert.alert('Hata', 'Beğenmek için giriş yapmalısınız');
        return;
      }

      console.log('❤️ Liking post:', postId, 'by user:', user.id);
      
      // Check if user already liked this post
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        if (checkError.code === 'PGRST205') {
          Alert.alert('Bilgi', 'Beğeni özelliği henüz aktif değil');
          return;
        }
        throw checkError;
      }

      if (existingLike) {
        // Unlike the post
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;
        console.log('💔 Post unliked');
      } else {
        // Like the post
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (insertError) throw insertError;
        console.log('❤️ Post liked');
      }

      // Refresh posts to update like count
      fetchPosts();
    } catch (error) {
      console.error('Error handling like:', error);
      Alert.alert('Hata', 'Beğeni işlemi sırasında hata oluştu');
    }
  };

  const showActionSheetOptions = () => {
    if (!selectedPost) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['İptal', 'Gönderiyi Sil', 'Kullanıcıyı Engelle'],
          destructiveButtonIndex: [1, 2],
          cancelButtonIndex: 0,
          title: selectedPost.title || 'Gönderi İşlemleri'
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            deletePost(selectedPost.id, selectedPost.title);
          } else if (buttonIndex === 2) {
            showBlockConfirmation(selectedPost);
          }
        }
      );
    } else {
      Alert.alert(
        'Gönderi İşlemleri',
        selectedPost.title || 'Gönderi',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Gönderiyi Sil', 
            style: 'destructive',
            onPress: () => deletePost(selectedPost.id, selectedPost.title)
          },
          { 
            text: 'Kullanıcıyı Engelle', 
            style: 'destructive',
            onPress: () => showBlockConfirmation(selectedPost)
          }
        ]
      );
    }
    setShowActionSheet(false);
  };

  useEffect(() => {
    if (showActionSheet) {
      showActionSheetOptions();
    }
  }, [showActionSheet]);

  const showPostOptions = (post: Post) => {
    const isOwnPost = user?.id === post.user_id;
    const isAdmin = currentUserData?.role === 'admin';
    const isModerator = currentUserData?.role === 'moderator';

    const options = [
      { text: 'İptal', style: 'cancel' as const },
      {
        text: 'Detayları Görüntüle',
        style: 'default' as const,
        onPress: () => router.push(`/post-detail/${post.id}`)
      },
      {
        text: 'Profili Görüntüle',
        style: 'default' as const,
        onPress: () => router.push(`/user-profile/${post.user_id}`)
      }
    ];

    if (isOwnPost) {
      options.push({
        text: 'Düzenle',
        style: 'default' as const,
        onPress: () => router.push(`/edit-post/${post.id}`)
      });
    }

    if (isOwnPost || isAdmin || isModerator) {
      options.push({
        text: 'Sil',
        style: 'default' as const,
        onPress: () => deletePost(post.id, post.title)
      });
    }

    Alert.alert(
      'Paylaşım İşlemleri',
      `${post.profiles?.first_name || 'Bilinmeyen'} ${post.profiles?.last_name || 'Kullanıcı'} tarafından paylaşılan içerik`,
      options
    );
  };

  const getTitleAbbreviation = (branch: string) => {
    const abbreviations: Record<string, string> = {
      'Doktor': 'Dr.',
      'Diş Hekimi': 'Dt.',
      'Eczacı': 'Ecz.',
      'Hemşire': 'Hemşire',
      'Fizyoterapi ve Rehabilitasyon': 'Fzt.',
      'Ebe': 'Ebe',
      'İlk ve Acil Yardım Teknikeri': 'Prm.',
      'Paramedik': 'Prm.',
      'Anestezi Teknikeri': 'Anest. Tekn.',
      'Anestezist': 'Anest.',
      'Ameliyathane Teknisyeni': 'Amel. Tekn.',
      'Tıbbi Görüntüleme Teknisyeni': 'Rad. Tekn.',
      'Tıbbi Laboratuvar Teknisyeni': 'Lab. Tekn.',
      'Diyaliz Teknisyeni': 'Diy. Tekn.',
      'Optisyen': 'Opt.',
      'Odyolog': 'Ody.',
      'Radyoterapi Teknisyeni': 'Radyoter. Tekn.',
      'Çocuk Gelişimi Uzmanı': 'Çoc. Gel. Uzm.',
      'Yaşlı Bakım Teknisyeni': 'Yaşlı Bak. Tekn.',
      'Tıbbi Sekreter': 'Tıbbi Sek.',
      'Perfüzyon Teknisyeni': 'Perf. Tekn.',
      'Acil Tıp Teknisyeni': 'Acil Tıp Tekn.',
      'Diyetisyen': 'Dyt.',
      'Beslenme ve Diyetetik': 'Dyt.',
    };
    
    return abbreviations[branch] || branch;
  };

  const getFormattedName = (firstName: string, lastName: string, branch: string) => {
    return `${firstName} ${lastName.toUpperCase()}`;
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'vaka': return '#DC2626';
      case 'soru': return '#059669';
      case 'etkinlik': return '#7C3AED';
      case 'anket': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getPostTypeText = (type: string) => {
    switch (type) {
      case 'vaka': return 'Vaka';
      case 'soru': return 'Soru';
      case 'etkinlik': return 'Etkinlik';
      case 'anket': return 'Anket';
      default: return 'Genel';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${post.profiles?.first_name || ''} ${post.profiles?.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedPostType === 'all' || post.post_type === selectedPostType;
    
    return matchesSearch && matchesType;
  });

  const handlePostPress = (item: Post) => {
    if (item.post_type === 'anket') {
      router.push(`/survey-detail/${item.id}`);
    } else if (item.post_type === 'etkinlik') {
      router.push(`/event-detail/${item.id}`);
    } else {
      router.push(`/post-detail/${item.id}`);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={[
      styles.postCard,
      item.post_type === 'vaka' && styles.vakaCard,
      item.post_type === 'soru' && styles.soruCard,
      item.post_type === 'etkinlik' && styles.etkinlikCard,
      item.post_type === 'anket' && styles.anketCard,
      ]}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push(`/user-profile/${item.user_id}`)}
          activeOpacity={0.7}
        >
          <Image 
            source={{ 
              uri: item.profiles?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
            }} 
            style={styles.userAvatar} 
          />
          <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>
                {item.profiles && item.profiles.first_name && item.profiles.last_name ? 
                  getFormattedName(item.profiles.first_name, item.profiles.last_name, item.profiles.branch || '') : 
                  'Bilinmeyen Kullanıcı'}
              </Text>
              {item.profiles?.role && item.profiles.role !== 'user' && (
                <View style={[
                  styles.roleIndicator,
                  item.profiles.role === 'admin' && styles.adminRole,
                  item.profiles.role === 'moderator' && styles.moderatorRole,
                ]}>
                  <Text style={styles.roleEmoji}>
                    {item.profiles.role === 'admin' ? '👑' : '🛡️'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.userTitle}>
              {item.profiles?.branch || 'Branş Bilgisi Yok'}
              {(item.profiles as any)?.institution && ` • ${(item.profiles as any).institution}`}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.postMeta}>
          <View style={[styles.postTypeTag, { backgroundColor: getPostTypeColor(item.post_type) }]}>
            <Text style={styles.postTypeIcon}>
              {postTypes.find(t => t.id === item.post_type)?.icon || '📝'}
            </Text>
            <Text style={styles.postTypeText}>{getPostTypeText(item.post_type)}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => showPostOptions(item)}
            >
              <MoreVertical size={20} color="#6B7280" />
            </TouchableOpacity>
            {isAdminOrModerator && (
              <TouchableOpacity
                style={styles.adminActionButton}
                onPress={() => handlePostAction(item)}
                activeOpacity={0.7}
              >
                <Shield size={18} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      {item.title && (
        <Text style={styles.postTitle}>{item.title}</Text>
      )}
      <Text style={styles.postContent} numberOfLines={4}>
        {item.content}
      </Text>
      
      {item.media_urls && item.media_urls.length > 0 && (
        <ScrollView horizontal style={styles.mediaContainer} showsHorizontalScrollIndicator={false}>
          {item.media_urls.map((url, index) => (
            <TouchableOpacity key={index} activeOpacity={0.8}>
              <Image source={{ uri: url }} style={styles.mediaImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Event Details */}
      {item.post_type === 'etkinlik' && (
        <View style={styles.eventDetailsContainer}>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailLabel}>📅 Tarih:</Text>
            <Text style={styles.eventDetailValue}>{item.event_date}</Text>
          </View>
          {item.event_time && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>🕐 Saat:</Text>
              <Text style={styles.eventDetailValue}>{item.event_time}</Text>
            </View>
          )}
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailLabel}>📍 Konum:</Text>
            <Text style={styles.eventDetailValue}>{item.event_location}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailLabel}>👥 Katılımcı:</Text>
            <Text style={styles.eventDetailValue}>{item.max_participants} kişi</Text>
          </View>
          {item.registration_deadline && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>⏰ Kayıt Son Tarihi:</Text>
              <Text style={[
                styles.eventDetailValue,
                (() => {
                  try {
                    // Parse DD/MM/YYYY format
                    const [day, month, year] = item.registration_deadline.split('/').map(Number);
                    
                    // Get current date (start of day for fair comparison)
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    
                    // Create deadline date (start of day for fair comparison)
                    const deadlineDateOnly = new Date(year, month - 1, day);
                    
                    console.log('🔍 Event deadline check:', {
                      deadline: item.registration_deadline,
                      deadlineDateOnly: deadlineDateOnly.toISOString(),
                      today: today.toISOString(),
                      now: now.toISOString(),
                      isExpired: today > deadlineDateOnly
                    });
                    
                    // Only show expired if today is after the deadline date
                    return today > deadlineDateOnly ? styles.eventDetailExpired : null;
                  } catch (error) {
                    console.error('Error parsing deadline:', error);
                    return null;
                  }
                })()
              ]}>
                {item.registration_deadline}
                {(() => {
                  try {
                    // Parse DD/MM/YYYY format
                    const [day, month, year] = item.registration_deadline.split('/').map(Number);
                    
                    // Get current date (start of day for fair comparison)
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    
                    // Compare dates only (ignore time)
                    const deadlineDateOnly = new Date(year, month - 1, day);
                    
                    console.log('🔍 Event deadline text check:', {
                      deadline: item.registration_deadline,
                      deadlineDateOnly: deadlineDateOnly.toISOString(),
                      today: today.toISOString(),
                      isExpired: today > deadlineDateOnly
                    });
                    
                    // Only show expired if today is after the deadline date
                    return today > deadlineDateOnly ? ' (Süresi Doldu)' : '';
                  } catch (error) {
                    console.error('Error parsing deadline for text:', error);
                    return '';
                  }
                })()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Inline Survey Questions */}
      {item.post_type === 'anket' && item.questions && item.questions.length > 0 && (
        <View style={styles.inlineSurveyContainer}>
          <Text style={styles.inlineSurveyTitle}>📊 Anket Soruları</Text>
          {item.questions.slice(0, 2).map((question, index) => (
            <View key={index} style={styles.inlineQuestionCard}>
                <View style={styles.inlineQuestionHeader}>
                  <Text style={styles.inlineQuestionNumber}>⭐</Text>
                  <Text style={styles.inlineQuestionText}>
                    {question.question}
                  </Text>
                </View>
              {question.type === 'multiple_choice' && question.options && (
                <View style={styles.inlineOptionsContainer}>
                  {question.options.filter(option => option && option.trim()).map((option, optionIndex) => {
                    const responseKey = `${item.id}_${index}`;
                    const isSelected = surveyResponses[responseKey] === option;
                    return (
                      <TouchableOpacity
                        key={optionIndex}
                        style={[
                          styles.inlineOptionButton,
                          isSelected && styles.inlineOptionButtonSelected
                        ]}
                        onPress={() => {
                          // Immediately update local state for instant UI feedback
                          const responseKey = `${item.id}_${index}`;
                          setSurveyResponses(prev => ({
                            ...prev,
                            [responseKey]: option
                          }));
                          
                          // Then handle database save
                          handleSurveyResponse(item.id, index, question.question, option, 'option');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.inlineOptionCircle,
                          isSelected && styles.inlineOptionCircleSelected
                        ]} />
                        <Text style={[
                          styles.inlineOptionText,
                          isSelected && styles.inlineOptionTextSelected
                        ]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {question.type === 'rating' && (
                <View style={styles.inlineRatingContainer}>
                  <Text style={styles.ratingLabel}>Puanınız:</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const responseKey = `${item.id}_${index}`;
                      const selectedRating = surveyResponses[responseKey];
                      const isFilled = selectedRating && rating <= selectedRating;
                      
                      return (
                        <TouchableOpacity
                          key={rating}
                          style={styles.inlineRatingButton}
                          onPress={() => {
                            // Immediately update local state for instant UI feedback
                            const responseKey = `${item.id}_${index}`;
                            setSurveyResponses(prev => ({
                              ...prev,
                              [responseKey]: rating
                            }));
                            
                            // Then handle database save
                            handleSurveyResponse(item.id, index, question.question, rating, 'rating');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.inlineRatingStarText,
                            isFilled && styles.inlineRatingStarTextSelected
                          ]}>
                            {isFilled ? '⭐' : '☆'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {surveyResponses[`${item.id}_${index}`] && (
                    <Text style={styles.ratingValue}>
                      {surveyResponses[`${item.id}_${index}`]}/5
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
          {item.questions.length > 2 && (
            <TouchableOpacity 
              style={styles.viewMoreQuestionsButton}
              onPress={() => router.push(`/survey-detail/${item.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewMoreQuestionsText}>
                +{item.questions.length - 2} soru daha göster
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.postFooter}>
        <Text style={styles.postTime}>
          {formatPostDateTime(item.created_at)}
        </Text>
        {item.updated_at !== item.created_at && (
          <Text style={styles.editedText}>Düzenlendi</Text>
        )}
      </View>
      
      <View style={styles.postActions}>
        {item.post_type === 'anket' ? (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <BarChart3 size={18} color="#6B7280" />
              <Text style={styles.actionText}>
                {item.survey_response_count || 0} Cevap
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.surveyActionButton]}
              onPress={() => {
                console.log('🔍 Navigating to survey detail with ID:', item.id);
                router.push(`/survey-detail/${item.id}`);
              }}
              activeOpacity={0.7}
            >
              <Eye size={18} color="#FFFFFF" />
              <Text style={[styles.actionText, styles.surveyActionText]}>Anketi Görüntüle</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
        <TouchableOpacity 
          style={styles.actionButton}
              onPress={() => router.push(`/post-detail/${item.id}`)}
          activeOpacity={0.7}
        >
              <MessageCircle size={18} color="#6B7280" />
              <Text style={styles.actionText}>Yorumlar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.7}
              onPress={() => handleLike(item.id)}
            >
              <Heart 
                size={18} 
                color={item.is_liked ? "#EF4444" : "#6B7280"} 
                fill={item.is_liked ? "#EF4444" : "none"}
              />
              <Text style={[
                styles.actionText,
                item.is_liked && styles.likedText
              ]}>
                Beğen {item.likes_count ? `(${item.likes_count})` : ''}
              </Text>
        </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderQuestion = (question: Question, index: number) => (
    <View key={question.id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Soru {index + 1}</Text>
        <TouchableOpacity
          style={styles.removeQuestionButton}
          onPress={() => removeQuestion(question.id)}
        >
          <X size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.questionInput}
        placeholder="Sorunuzu yazın..."
        value={question.question}
        onChangeText={(text) => updateQuestion(question.id, 'question', text)}
        placeholderTextColor="#9CA3AF"
      />

      <View style={styles.questionTypeContainer}>
        <Text style={styles.questionTypeLabel}>Soru Tipi:</Text>
        <View style={styles.questionTypeButtons}>
          {[
            { type: 'text', label: 'Metin', icon: '📝' },
            { type: 'multiple_choice', label: 'Çoktan Seçmeli', icon: '☑️' },
            { type: 'rating', label: 'Puanlama', icon: '⭐' },
          ].map((type) => (
            <TouchableOpacity
              key={type.type}
              style={[
                styles.typeButton,
                question.type === type.type && styles.activeTypeButton
              ]}
              onPress={() => updateQuestion(question.id, 'type', type.type)}
            >
              <Text style={styles.typeButtonIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeButtonText,
                question.type === type.type && styles.activeTypeButtonText
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {question.type === 'multiple_choice' && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>Seçenekler:</Text>
          {question.options?.map((option, optionIndex) => (
            <View key={optionIndex} style={styles.optionRow}>
              <Text style={styles.optionLetter}>
                {String.fromCharCode(65 + optionIndex)})
              </Text>
              <TextInput
                style={styles.optionInput}
                placeholder={`Seçenek ${String.fromCharCode(65 + optionIndex)}`}
                value={option}
                onChangeText={(text) => updateOption(question.id, optionIndex, text)}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.removeOptionButton}
                onPress={() => removeOption(question.id, optionIndex)}
              >
                <X size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addOptionButton}
            onPress={() => addOption(question.id)}
          >
            <Plus size={16} color="#F59E0B" />
            <Text style={styles.addOptionText}>Seçenek Ekle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Prospektüs</Text>
          {isAdminOrModerator && (
            <View style={styles.adminBadge}>
              <Shield size={14} color="#FFFFFF" />
              <Text style={styles.adminText}>
                {profile?.role === 'admin' ? 'Admin' : 'Moderatör'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Paylaşımlarda ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, selectedPostType !== 'all' && styles.activeFilterButton]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={20} color={selectedPostType !== 'all' ? "#FFFFFF" : "#6B7280"} />
        </TouchableOpacity>
      </View>

      {/* Active Filter */}
      {selectedPostType !== 'all' && (
        <View style={styles.activeFilterContainer}>
          <View style={[styles.activeFilterTag, { backgroundColor: getPostTypeColor(selectedPostType) }]}>
            <Text style={styles.activeFilterIcon}>
              {postTypes.find(t => t.id === selectedPostType)?.icon}
            </Text>
            <Text style={styles.activeFilterText}>
              {postTypes.find(t => t.id === selectedPostType)?.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedPostType('all')}>
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Posts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Paylaşımlar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          style={styles.postsList}
          contentContainerStyle={styles.postsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#EF4444']}
              tintColor="#EF4444"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Modern Header with Gradient */}
          <View style={styles.modernModalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalHeaderLeft}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => {
              setShowCreateModal(false);
              resetForm();
                  }}
                  activeOpacity={0.7}
                >
                  <X size={24} color="#6B7280" />
            </TouchableOpacity>
              </View>
              <View style={styles.modalHeaderCenter}>
                <Text style={styles.modernModalTitle}>Yeni Paylaşım</Text>
                <Text style={styles.modalSubtitle}>Meslektaşlarınızla bilgi paylaşın</Text>
              </View>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity 
                  style={styles.publishButton}
                  onPress={handleCreatePost}
                  activeOpacity={0.8}
                >
                  <Text style={styles.publishButtonText}>Paylaş</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerDivider} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Modern Post Type Selection */}
            <View style={styles.modernSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.modernSectionTitle}>Paylaşım Türü</Text>
                <Text style={styles.sectionDescription}>İçeriğinize uygun kategoriyi seçin</Text>
              </View>
              <View style={styles.modernPostTypeGrid}>
                {postTypes.slice(1).map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.modernPostTypeCard,
                      newPost.post_type === type.id && styles.selectedModernPostTypeCard,
                    ]}
                    onPress={() => {
                      const updatedPost = {...newPost, post_type: type.id as any};
                      // If selecting survey type and no questions exist, add first question
                      if (type.id === 'anket' && updatedPost.questions.length === 0) {
                        updatedPost.questions = [{
                          id: Date.now().toString(),
                          type: 'multiple_choice',
                          question: '',
                          options: ['', ''],
                          required: true
                        }];
                      }
                      setNewPost(updatedPost);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.postTypeIconContainer,
                      newPost.post_type === type.id && { backgroundColor: type.color + '20' }
                    ]}>
                    <Text style={[
                        styles.modernPostTypeIcon,
                        newPost.post_type === type.id && { color: type.color }
                      ]}>{type.icon}</Text>
                    </View>
                    <View style={styles.postTypeContent}>
                      <Text style={[
                        styles.modernPostTypeTitle,
                      newPost.post_type === type.id && { color: type.color }
                    ]}>{type.title}</Text>
                      <Text style={styles.modernPostTypeDesc}>
                        {type.id === 'genel' && 'Günlük deneyimler ve bilgi paylaşımı'}
                      {type.id === 'vaka' && 'Klinik vakalar, tanı ve tedavi'}
                      {type.id === 'soru' && 'Merak ettiklerinizi sorun'}
                      {type.id === 'etkinlik' && 'Kongre, seminer, eğitim duyuruları'}
                      {type.id === 'anket' && 'Meslektaşlarınızın görüşlerini alın'}
                    </Text>
                    </View>
                    {newPost.post_type === type.id && (
                      <View style={[styles.selectedIndicator, { backgroundColor: type.color }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modern Title Input - Hidden for Survey */}
            {newPost.post_type !== 'anket' && (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.modernSectionTitle}>Başlık</Text>
                  <Text style={styles.sectionDescription}>Paylaşımınız için çekici bir başlık yazın</Text>
                </View>
                <View style={styles.modernInputContainer}>
              <TextInput
                    style={styles.modernTitleInput}
                    placeholder="Örn: Yeni tedavi yöntemi hakkında deneyimlerim"
                value={newPost.title}
                onChangeText={(text) => setNewPost({...newPost, title: text})}
                placeholderTextColor="#9CA3AF"
                    maxLength={100}
              />
                  <Text style={styles.characterCount}>{newPost.title.length}/100</Text>
            </View>
              </View>
            )}

            {/* Modern Content Input - Hidden for Survey */}
            {newPost.post_type !== 'anket' && (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.modernSectionTitle}>İçerik</Text>
                  <Text style={styles.sectionDescription}>
                    {newPost.post_type === 'vaka' && 'Vaka detaylarını, tanı ve tedavi sürecini paylaşın'}
                    {newPost.post_type === 'soru' && 'Merak ettiğiniz konuyu detaylı bir şekilde sorun'}
                    {newPost.post_type === 'etkinlik' && 'Etkinlik bilgilerini, tarih ve yer bilgilerini ekleyin'}
                    {newPost.post_type === 'genel' && 'Paylaşmak istediğiniz deneyim veya bilgiyi yazın'}
                  </Text>
                </View>
                <View style={styles.modernInputContainer}>
              <TextInput
                    style={styles.modernContentInput}
                placeholder={
                  newPost.post_type === 'vaka'
                        ? 'Hasta profili, semptomlar, tanı süreci, uygulanan tedavi ve sonuçları...'
                    : newPost.post_type === 'soru'
                        ? 'Sorunuzu detaylı bir şekilde açıklayın...'
                    : newPost.post_type === 'etkinlik'
                        ? 'Etkinlik adı, tarihi, yeri, konuşmacılar ve kayıt bilgileri...'
                        : 'Deneyimlerinizi, önerilerinizi veya bilgilerinizi paylaşın...'
                }
                value={newPost.content}
                onChangeText={(text) => setNewPost({...newPost, content: text})}
                multiline
                    numberOfLines={8}
                placeholderTextColor="#9CA3AF"
                    textAlignVertical="top"
                    maxLength={2000}
              />
                  <Text style={styles.characterCount}>{newPost.content.length}/2000</Text>
            </View>
              </View>
            )}

            {/* Modern Media Upload */}
            {(newPost.post_type === 'genel' || newPost.post_type === 'vaka') && (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.modernSectionTitle}>Görseller</Text>
                  <Text style={styles.sectionDescription}>Paylaşımınızı destekleyecek görseller ekleyin (isteğe bağlı)</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.modernMediaUploadButton}
                  onPress={handleImagePicker}
                  disabled={uploadingMedia}
                  activeOpacity={0.8}
                >
                  <View style={styles.mediaUploadIconContainer}>
                  {uploadingMedia ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <ImagePlus size={24} color="#EF4444" />
                    )}
                  </View>
                  <View style={styles.mediaUploadContent}>
                    <Text style={styles.modernMediaUploadTitle}>
                      {uploadingMedia ? 'Görsel Yükleniyor...' : 'Görsel Ekle'}
                  </Text>
                    <Text style={styles.modernMediaUploadDesc}>
                      JPG, PNG formatında, maksimum 5MB
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {newPost.media_urls.length > 0 && (
                  <View style={styles.modernUploadedMedia}>
                    <Text style={styles.uploadedMediaTitle}>Eklenen Görseller ({newPost.media_urls.length})</Text>
                    <View style={styles.uploadedMediaGrid}>
                    {newPost.media_urls.map((url, index) => (
                        <View key={index} style={styles.modernUploadedImageContainer}>
                          <Image source={{ uri: url }} style={styles.modernUploadedImage} />
                        <TouchableOpacity
                            style={styles.modernRemoveImageButton}
                          onPress={() => removeImage(index)}
                            activeOpacity={0.8}
                        >
                            <X size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Event Fields */}
            {newPost.post_type === 'etkinlik' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Etkinlik Detayları</Text>
                
                <View style={styles.eventFieldsGrid}>
                  <View style={styles.eventField}>
                    <Text style={styles.eventFieldLabel}>Tarih *</Text>
                    <TextInput
                      style={styles.eventInput}
                      placeholder="GG/AA/YYYY (örn: 15/03/2024)"
                      value={newPost.event_date}
                      onChangeText={(text) => {
                        // Remove all non-numeric characters
                        const numericText = text.replace(/\D/g, '');
                        
                        // Add slashes automatically
                        let formattedText = numericText;
                        if (numericText.length >= 2) {
                          formattedText = numericText.substring(0, 2) + '/' + numericText.substring(2);
                        }
                        if (numericText.length >= 4) {
                          formattedText = numericText.substring(0, 2) + '/' + numericText.substring(2, 4) + '/' + numericText.substring(4, 8);
                        }
                        
                        setNewPost({...newPost, event_date: formattedText});
                      }}
                      keyboardType="numeric"
                      maxLength={10}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  
                  <View style={styles.eventField}>
                    <Text style={styles.eventFieldLabel}>Saat</Text>
                    <TextInput
                      style={styles.eventInput}
                      placeholder="HH:MM"
                      value={newPost.event_time}
                      onChangeText={(text) => {
                        // Remove all non-numeric characters
                        const numericText = text.replace(/\D/g, '');
                        
                        // Add colon automatically
                        let formattedText = numericText;
                        if (numericText.length >= 2) {
                          formattedText = numericText.substring(0, 2) + ':' + numericText.substring(2, 4);
                        }
                        
                        setNewPost({...newPost, event_time: formattedText});
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.eventField}>
                  <Text style={styles.eventFieldLabel}>Konum *</Text>
                  <TextInput
                    style={styles.eventInput}
                    placeholder="Etkinlik konumu"
                    value={newPost.event_location}
                    onChangeText={(text) => setNewPost({...newPost, event_location: text})}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.eventFieldsGrid}>
                  <View style={styles.eventField}>
                    <Text style={styles.eventFieldLabel}>Max Katılımcı</Text>
                    <TextInput
                      style={styles.eventInput}
                      placeholder="50"
                      value={newPost.max_participants}
                      onChangeText={(text) => setNewPost({...newPost, max_participants: text})}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  
                  <View style={styles.eventField}>
                    <Text style={styles.eventFieldLabel}>Kayıt Son Tarihi *</Text>
                    <TextInput
                      style={styles.eventInput}
                      placeholder="GG/AA/YYYY (örn: 20/03/2024)"
                      value={newPost.registration_deadline}
                      onChangeText={(text) => {
                        // Remove all non-numeric characters
                        const numericText = text.replace(/\D/g, '');
                        
                        // Add slashes automatically
                        let formattedText = numericText;
                        if (numericText.length >= 2) {
                          formattedText = numericText.substring(0, 2) + '/' + numericText.substring(2);
                        }
                        if (numericText.length >= 4) {
                          formattedText = numericText.substring(0, 2) + '/' + numericText.substring(2, 4) + '/' + numericText.substring(4, 8);
                        }
                        
                        setNewPost({...newPost, registration_deadline: formattedText});
                      }}
                      keyboardType="numeric"
                      maxLength={10}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Survey Questions */}
            {newPost.post_type === 'anket' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Anket Soruları</Text>
                {newPost.questions.map((question, index) => renderQuestion(question, index))}
                
                <TouchableOpacity
                  style={styles.addQuestionButton}
                  onPress={addQuestion}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addQuestionText}>Yeni Soru Ekle</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent={true}>
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Paylaşım Türü Filtrele</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.filterOption,
                    selectedPostType === type.id && styles.selectedFilterOption,
                    selectedPostType === type.id && { borderColor: type.color }
                  ]}
                  onPress={() => {
                    setSelectedPostType(type.id);
                    setShowFilterModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterOptionIcon}>{type.icon}</Text>
                  <View style={[styles.filterOptionDot, { backgroundColor: type.color }]} />
                  <Text style={[
                    styles.filterOptionText,
                    selectedPostType === type.id && { color: type.color, fontWeight: '600' }
                  ]}>
                    {type.title}
                  </Text>
                  {selectedPostType === type.id && (
                    <Text style={[styles.checkMark, { color: type.color }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Reklam Banner - Alt navigasyonun üstünde */}
      <View style={styles.bannerContainer}>
        <AdvertisementBanner 
          onPress={() => {
            // Reklam tıklama işlemi
            console.log('Reklam banner\'ına tıklandı');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 100,
    maxHeight: 100,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  adminText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  activeFilterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  activeFilterIcon: {
    fontSize: 16,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  postsList: {
    flex: 1,
  },
  postsContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vakaCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    backgroundColor: '#FFFBFB',
  },
  soruCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    backgroundColor: '#F6FFFA',
  },
  etkinlikCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    backgroundColor: '#FDFAFF',
  },
  anketCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFDF7',
  },
  eventDetailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginRight: 8,
    minWidth: 120,
  },
  eventDetailValue: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  eventDetailExpired: {
    color: '#DC2626',
    fontWeight: '600',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  userDetails: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  roleIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  adminRole: {
    backgroundColor: '#FEF2F2',
  },
  moderatorRole: {
    backgroundColor: '#F0FDF4',
  },
  roleEmoji: {
    fontSize: 12,
  },
  userTitle: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  postMeta: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  postTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    gap: 4,
  },
  postTypeIcon: {
    fontSize: 14,
  },
  postTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F8FAFC',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 16,
  },
  postTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  editedText: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '600',
  },
  surveyActionButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
    flex: 1,
    justifyContent: 'center',
  },
  surveyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  postTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  postTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPostTypeCard: {
    backgroundColor: '#FEFEFE',
    shadowOpacity: 0.15,
    transform: [{ scale: 1.02 }],
  },
  postTypeCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  postTypeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  postTypeCardDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 120,
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaUploadButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mediaUploadText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadedMedia: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  uploadedImageContainer: {
    position: 'relative',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventFieldsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  eventField: {
    flex: 1,
  },
  eventFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  eventInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  removeQuestionButton: {
    padding: 4,
  },
  questionInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionTypeContainer: {
    marginBottom: 16,
  },
  questionTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  questionTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  activeTypeButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  typeButtonIcon: {
    fontSize: 14,
  },
  typeButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    width: 24,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeOptionButton: {
    padding: 4,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 8,
  },
  addOptionText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  addQuestionButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addQuestionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  createPostButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  filterOptions: {
    padding: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedFilterOption: {
    backgroundColor: '#FEFEFE',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  filterOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '700',
  },
  likedText: {
    color: '#EF4444',
    fontWeight: '600',
  },

  // Modern Modal Styles
  modernModalHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderLeft: {
    width: 40,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modernModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalHeaderRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  publishButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Modern Section Styles
  modernSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Modern Post Type Grid
  modernPostTypeGrid: {
    gap: 12,
  },
  modernPostTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  selectedModernPostTypeCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  postTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernPostTypeIcon: {
    fontSize: 20,
    color: '#64748B',
  },
  postTypeContent: {
    flex: 1,
  },
  modernPostTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  modernPostTypeDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modern Input Styles
  modernInputContainer: {
    position: 'relative',
  },
  modernTitleInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
  },
  modernContentInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FAFAFA',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#94A3B8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // Modern Media Upload
  modernMediaUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  mediaUploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mediaUploadContent: {
    flex: 1,
  },
  modernMediaUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  modernMediaUploadDesc: {
    fontSize: 14,
    color: '#64748B',
  },
  modernUploadedMedia: {
    marginTop: 16,
  },
  uploadedMediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  uploadedMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernUploadedImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  modernUploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  modernRemoveImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSpacing: {
    height: 40,
  },

  // Inline Survey Styles
  inlineSurveyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineSurveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  inlineQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  inlineQuestionNumber: {
    fontSize: 16,
    color: '#FBBF24',
    marginTop: 1,
  },
  inlineQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },
  inlineOptionsContainer: {
    gap: 8,
  },
  inlineOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inlineOptionCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    marginRight: 8,
  },
  inlineOptionText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  inlineRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    minWidth: 60,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    flex: 1,
    justifyContent: 'flex-start',
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    minWidth: 25,
    textAlign: 'right',
  },
  inlineRatingButton: {
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    padding: 2,
  },
  inlineRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inlineRatingStarText: {
    fontSize: 20,
    color: '#CBD5E1', // Light gray for empty stars
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  viewMoreQuestionsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    alignItems: 'center',
  },
  viewMoreQuestionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Selected states for survey options
  inlineOptionButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#7C3AED',
  },
  inlineOptionCircleSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  inlineOptionTextSelected: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  inlineRatingButtonSelected: {
    backgroundColor: 'transparent',
    transform: [{ scale: 1.1 }],
  },
  inlineRatingTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inlineRatingStarTextSelected: {
    fontSize: 22,
    color: '#FBBF24', // Bright golden yellow for filled stars
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 75, // Tab bar yüksekliği
    left: 0,
    right: 0,
    zIndex: 5,
    elevation: 5,
    paddingHorizontal: 16,
  },
});