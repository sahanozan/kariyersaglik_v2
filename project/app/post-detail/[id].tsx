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
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, MessageCircle, User, Calendar, MoveVertical as MoreVertical, Trash2, Shield, UserX, Reply, Plus, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'genel' | 'vaka' | 'soru' | 'etkinlik' | 'survey';
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
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    branch: string;
    avatar_url: string | null;
    role: string;
  };
  replies?: Comment[];
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: any[];
  expires_at: string | null;
  is_active: boolean;
}

interface SurveyResponse {
  id: string;
  responses: any;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    branch: string;
  };
}

export default function PostDetailPage() {
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCurrentUserData();
      fetchPost();
      fetchComments();
    }
  }, [id, user]);

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

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
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
        .eq('id', postId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ Error fetching post:', error);
        throw error;
      }
      
      console.log('📝 Post data fetched:', data);
      console.log('👤 Post profiles data:', data?.profiles);
      setPost(data as Post);

      // If it's a survey post, fetch survey data
      if (data.post_type === 'survey') {
        await fetchSurveyData();
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Hata', 'Paylaşım yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveyData = async () => {
    try {
      if (!id) return;

      // Fetch survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('user_id', post?.user_id || '')
        .eq('title', post?.title || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (surveyError) throw surveyError;
      setSurvey(surveyData as Survey);

      if (surveyData) {
        // Check if user has responded
        const { data: userResponse, error: responseError } = await supabase
          .from('survey_responses' as any)
          .select('id')
          .eq('survey_id', surveyData.id)
          .eq('user_id', user?.id || '')
          .maybeSingle();

        if (responseError && responseError.code !== 'PGRST116') throw responseError;
        setHasResponded(!!userResponse);

        // Fetch all responses for display
        const { data: allResponses, error: allResponsesError } = await supabase
          .from('survey_responses' as any)
          .select(`
            *,
            profiles!survey_responses_user_id_fkey(first_name, last_name, branch)
          `)
          .eq('survey_id', surveyData.id);

        if (allResponsesError) throw allResponsesError;
        setSurveyResponses((allResponses || []) as unknown as SurveyResponse[]);
      }
    } catch (error) {
      console.error('Error fetching survey data:', error);
    }
  };

  const fetchComments = async () => {
    try {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey(first_name, last_name, branch, avatar_url, role)
        `)
        .eq('post_id', Array.isArray(id) ? id[0] : id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group comments by parent_id
      const commentsMap = new Map();
      const rootComments: Comment[] = [];

      (data || []).forEach(comment => {
        const commentData = {
          ...comment,
          replies: []
        };

        if (comment.parent_id) {
          // This is a reply
          if (commentsMap.has(comment.parent_id)) {
            commentsMap.get(comment.parent_id).replies.push(commentData);
          }
        } else {
          // This is a root comment
          rootComments.push(commentData as Comment);
          commentsMap.set(comment.id, commentData);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!user?.id || !id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: Array.isArray(id) ? id[0] : id,
          user_id: user?.id || '',
          content: newComment.trim(),
          parent_id: replyingTo
        });

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Hata', 'Yorum eklenirken hata oluştu');
    }
  };

  const handleSurveySubmit = async () => {
    if (!survey || !user?.id) return;

    // Validate required questions
    const requiredQuestions = survey.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!surveyAnswers[question.id] || surveyAnswers[question.id] === '') {
        Alert.alert('Hata', `"${question.question}" sorusu zorunludur`);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('survey_responses' as any)
        .insert({
          survey_id: survey?.id || '',
          user_id: user?.id || '',
          responses: surveyAnswers as any
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Anket cevabınız gönderildi!');
      setHasResponded(true);
      setShowSurveyModal(false);
      fetchSurveyData(); // Refresh survey data
    } catch (error) {
      console.error('Error submitting survey:', error);
      Alert.alert('Hata', 'Anket cevabı gönderilirken hata oluştu');
    }
  };

  const handleEventRegistration = async () => {
    if (!user?.id || !id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      // Find the event associated with this post
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', post?.user_id || '')
        .eq('title', post?.title || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (eventError) throw eventError;

      if (!eventData) {
        Alert.alert('Hata', 'Etkinlik bulunamadı');
        return;
      }

      // Check if already registered
      const { data: existingRegistration, error: checkError } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingRegistration) {
        Alert.alert('Bilgi', 'Bu etkinliğe zaten kayıt oldunuz');
        return;
      }

      // Register for event
      const { error: registerError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventData.id,
          user_id: user?.id || '',
          status: 'pending',
          message: 'Etkinliğe katılmak istiyorum'
        });

      if (registerError) throw registerError;

      Alert.alert('Başarılı', 'Etkinlik kaydınız gönderildi! Etkinlik sahibi tarafından onaylanacaktır.');
    } catch (error) {
      console.error('Error registering for event:', error);
      Alert.alert('Hata', 'Etkinlik kaydı yapılırken hata oluştu');
    }
  };
  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id
        })
        .eq('id', commentId);

      if (error) throw error;

      Alert.alert('Başarılı', 'Yorum silindi');
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Hata', 'Yorum silinirken hata oluştu');
    }
  };

  const showCommentOptions = (comment: Comment) => {
    const isOwnComment = user?.id === comment.user_id;
    const isAdmin = currentUserData?.role === 'admin';
    const isModerator = currentUserData?.role === 'moderator';

    const options = [
      { text: 'İptal', style: 'cancel' as const },
      {
        text: 'Yanıtla',
        style: 'default' as const,
        onPress: () => setReplyingTo(comment.id)
      },
      {
        text: 'Profili Görüntüle',
        style: 'default' as const,
        onPress: () => router.push(`/user-profile/${comment.user_id}`)
      }
    ];

    if (isOwnComment || isAdmin || isModerator) {
      options.push({
        text: 'Sil',
        style: 'default' as const,
        onPress: () => deleteComment(comment.id)
      });
    }

    Alert.alert(
      'Yorum İşlemleri',
      `${comment.profiles?.first_name || 'Bilinmeyen'} ${comment.profiles?.last_name || 'Kullanıcı'} tarafından yazılan yorum`,
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
      case 'survey': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getPostTypeText = (type: string) => {
    switch (type) {
      case 'vaka': return 'Vaka';
      case 'soru': return 'Soru';
      case 'etkinlik': return 'Etkinlik';
      case 'survey': return 'Anket';
      default: return 'Genel';
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <TouchableOpacity 
        style={styles.commentUserInfo}
        onPress={() => router.push(`/user-profile/${item.user_id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ 
            uri: item.profiles?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }} 
          style={styles.commentAvatar} 
        />
        <View style={styles.commentUserDetails}>
          <View style={styles.commentUserName}>
            <Text style={styles.commentUserNameText}>
              {item.profiles ? 
                getFormattedName(item.profiles.first_name, item.profiles.last_name, item.profiles.branch) : 
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
          <Text style={styles.commentUserBranch}>{item.profiles?.branch || 'Branş Bilgisi Yok'}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>{item.content}</Text>
        <View style={styles.commentFooter}>
          <Text style={styles.commentTime}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')} - {new Date(item.created_at).toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setReplyingTo(item.id)}
            >
              <Reply size={14} color="#6B7280" />
              <Text style={styles.replyButtonText}>Yanıtla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => showCommentOptions(item)}
            >
              <MoreVertical size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Replies */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map((reply) => (
            <View key={reply.id} style={styles.replyContainer}>
              <TouchableOpacity 
                style={styles.replyUserInfo}
                onPress={() => router.push(`/user-profile/${reply.user_id}`)}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ 
                    uri: reply.profiles?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                  }} 
                  style={styles.replyAvatar} 
                />
                <View style={styles.replyUserDetails}>
                  <Text style={styles.replyUserName}>
                    {reply.profiles ? 
                      getFormattedName(reply.profiles.first_name, reply.profiles.last_name, reply.profiles.branch) : 
                      'Bilinmeyen Kullanıcı'}
                  </Text>
                  <Text style={styles.replyUserBranch}>{reply.profiles?.branch || 'Branş Bilgisi Yok'}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.replyText}>{reply.content}</Text>
              <View style={styles.replyFooter}>
                <Text style={styles.replyTime}>
                  {new Date(reply.created_at).toLocaleDateString('tr-TR')} - {new Date(reply.created_at).toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => showCommentOptions(reply)}
                >
                  <MoreVertical size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSurveyQuestion = (question: any, index: number) => {
    const questionId = question.id || index.toString();
    
    return (
      <View key={questionId} style={styles.surveyQuestionContainer}>
        <Text style={styles.surveyQuestionText}>
          {index + 1}. {question.question}
          {question.required && <Text style={styles.required}> *</Text>}
        </Text>
        
        {question.type === 'text' && (
          <TextInput
            style={styles.surveyTextInput}
            placeholder="Cevabınızı yazın..."
            value={surveyAnswers[questionId] || ''}
            onChangeText={(text) => setSurveyAnswers({...surveyAnswers, [questionId]: text})}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        )}
        
        {question.type === 'multiple_choice' && (
          <View style={styles.surveyOptionsContainer}>
            {question.options?.map((option: string, optionIndex: number) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.surveyOptionButton,
                  surveyAnswers[questionId] === option && styles.selectedSurveyOption,
                  styles.modernSurveyOption
                ]}
                onPress={() => setSurveyAnswers({...surveyAnswers, [questionId]: option})}
                activeOpacity={0.7}
              >
                <View style={styles.surveyOptionContent}>
                  <Text style={styles.surveyOptionLetter}>
                    {String.fromCharCode(65 + optionIndex)}
                  </Text>
                  <View style={[
                    styles.surveyOptionCircle,
                    surveyAnswers[questionId] === option && styles.selectedSurveyCircle
                  ]} />
                </View>
                <Text style={[
                  styles.surveyOptionText,
                  surveyAnswers[questionId] === option && styles.selectedSurveyOptionText
                ]}>
                  {option}
                </Text>
                {surveyAnswers[questionId] === option && (
                  <Text style={styles.surveyCheckMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yükleniyor...</Text>
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
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Bu paylaşım bulunamadı.</Text>
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
        <Text style={styles.headerTitle}>Paylaşım Detayı</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Content */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => router.push(`/user-profile/${post.user_id}`)}
              activeOpacity={0.7}
            >
              <Image 
                source={{ 
                  uri: post.profiles?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                }} 
                style={styles.userAvatar} 
              />
              <View style={styles.userDetails}>
                <View style={styles.userNameContainer}>
                  <Text style={styles.userName}>
                    {post.profiles ? 
                      getFormattedName(post.profiles.first_name, post.profiles.last_name, post.profiles.branch) : 
                      'Bilinmeyen Kullanıcı'}
                  </Text>
                  {post.profiles?.role && post.profiles.role !== 'user' && (
                    <View style={[
                      styles.roleIndicator,
                      post.profiles.role === 'admin' && styles.adminRole,
                      post.profiles.role === 'moderator' && styles.moderatorRole,
                    ]}>
                      <Text style={styles.roleEmoji}>
                        {post.profiles.role === 'admin' ? '👑' : '🛡️'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userTitle}>
                  {post.profiles?.branch || 'Branş Bilgisi Yok'}
                  {(post.profiles as any)?.institution && ` • ${(post.profiles as any).institution}`}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.postMeta}>
              <View style={[styles.postTypeTag, { backgroundColor: getPostTypeColor(post.post_type) }]}>
                <Text style={styles.postTypeText}>{getPostTypeText(post.post_type)}</Text>
              </View>
            </View>
          </View>
          
          {post.title && (
            <Text style={styles.postTitle}>{post.title}</Text>
          )}
          <Text style={styles.postContent}>{post.content}</Text>
          
          {/* Media Images */}
          {post.media_urls && post.media_urls.length > 0 && (
            <ScrollView horizontal style={styles.mediaContainer} showsHorizontalScrollIndicator={false}>
              {post.media_urls.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
              ))}
            </ScrollView>
          )}
          
          <View style={styles.postFooter}>
            <Text style={styles.postTime}>
              {new Date(post.created_at).toLocaleDateString('tr-TR')} - {new Date(post.created_at).toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            {post.updated_at !== post.created_at && (
              <Text style={styles.editedText}>Düzenlendi</Text>
            )}
          </View>

          {/* Survey Section */}
          {post.post_type === 'survey' && survey && (
            <View style={styles.surveySection}>
              <Text style={styles.surveySectionTitle}>📊 Anket</Text>
              {hasResponded ? (
                <View style={styles.surveyCompleted}>
                  <Text style={styles.surveyCompletedText}>✅ Bu anketi cevapladınız</Text>
                  <Text style={styles.surveyResponseCount}>
                    Toplam {surveyResponses.length} kişi cevapladı
                  </Text>
                  
                  {/* Survey Results */}
                  <View style={styles.surveyResults}>
                    <Text style={styles.surveyResultsTitle}>📈 Sonuçlar:</Text>
                    {survey.questions.map((question, qIndex) => (
                      <View key={qIndex} style={styles.questionResult}>
                        <Text style={styles.questionResultText}>{question.question}</Text>
                        
                        {question.type === 'multiple_choice' && (
                          <View style={styles.optionResults}>
                            {question.options?.map((option: string, oIndex: number) => {
                              const responseCount = surveyResponses.filter(r => 
                                r.responses[question.id] === option
                              ).length;
                              const percentage = surveyResponses.length > 0 ? 
                                Math.round((responseCount / surveyResponses.length) * 100) : 0;
                              
                              return (
                                <View key={oIndex} style={styles.optionResult}>
                                  <Text style={styles.optionResultText}>{option}</Text>
                                  <View style={styles.resultBar}>
                                    <View 
                                      style={[
                                        styles.resultBarFill, 
                                        { width: `${percentage}%` }
                                      ]} 
                                    />
                                  </View>
                                  <Text style={styles.resultPercentage}>
                                    {responseCount} ({percentage}%)
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                        
                        {question.type === 'rating' && (
                          <View style={styles.ratingResults}>
                            {[1, 2, 3, 4, 5].map((rating) => {
                              const responseCount = surveyResponses.filter(r => 
                                r.responses[question.id] === rating
                              ).length;
                              const percentage = surveyResponses.length > 0 ? 
                                Math.round((responseCount / surveyResponses.length) * 100) : 0;
                              
                              return (
                                <View key={rating} style={styles.ratingResult}>
                                  <Text style={styles.ratingResultLabel}>{rating}⭐</Text>
                                  <View style={styles.resultBar}>
                                    <View 
                                      style={[
                                        styles.resultBarFill, 
                                        { width: `${percentage}%` }
                                      ]} 
                                    />
                                  </View>
                                  <Text style={styles.resultPercentage}>
                                    {responseCount} ({percentage}%)
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.takeSurveyButton}
                  onPress={() => setShowSurveyModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.takeSurveyButtonText}>Anketi Cevapla</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Q&A Options Section */}
          {post.post_type === 'soru' && (() => {
            try {
              const qaData = JSON.parse(post.content);
              if (qaData.options && qaData.options.length > 0) {
                return (
                  <View style={styles.qaSection}>
                    <Text style={styles.qaSectionTitle}>🤔 Seçenekli Soru</Text>
                    <Text style={styles.qaQuestion}>{qaData.question}</Text>
                    
                    <View style={styles.qaOptionsVoting}>
                      {qaData.options.map((option: string, index: number) => {
                        const responses = qaData.responses || {};
                        const optionResponses = Object.values(responses).filter((r: any) => 
                          qaData.allowMultiple ? 
                            Array.isArray(r) && r.includes(option) : 
                            r === option
                        ).length;
                        const totalResponses = Object.keys(responses).length;
                        const percentage = totalResponses > 0 ? 
                          Math.round((optionResponses / totalResponses) * 100) : 0;
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={styles.qaVoteOption}
                            onPress={() => {
                              // Handle voting logic here
                              Alert.alert('Oylama', `"${option}" seçeneğine oy verdiniz!`);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.qaOptionHeader}>
                              <Text style={styles.qaOptionLetter}>
                                {String.fromCharCode(65 + index)})
                              </Text>
                              <Text style={styles.qaOptionText}>{option}</Text>
                            </View>
                            
                            {qaData.showResults && (
                              <View style={styles.qaVoteResults}>
                                <View style={styles.qaResultBar}>
                                  <View 
                                    style={[
                                      styles.qaResultBarFill, 
                                      { width: `${percentage}%` }
                                    ]} 
                                  />
                                </View>
                                <Text style={styles.qaResultText}>
                                  {optionResponses} oy ({percentage}%)
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    
                    <Text style={styles.qaVoteCount}>
                      Toplam {Object.keys(qaData.responses || {}).length} kişi oyladı
                    </Text>
                  </View>
                );
              }
            } catch (e) {
              // If content is not JSON, it's a regular question
              return null;
            }
            return null;
          })()}
          
          {/* Event Registration Section */}
          {post.post_type === 'etkinlik' && (
            <View style={styles.eventSection}>
              <Text style={styles.eventSectionTitle}>📅 Etkinlik Kaydı</Text>
              <TouchableOpacity
                style={styles.registerEventButton}
                onPress={() => router.push(`/event-detail/${post.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.registerEventButtonText}>Etkinliğe Katıl</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsSectionTitle}>
            💬 Yorumlar ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
          </Text>
          
          {/* Reply indicator */}
          {replyingTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>Yanıt yazıyorsunuz...</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <X size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <Image 
              source={{ 
                uri: currentUserData?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
              }} 
              style={styles.currentUserAvatar} 
            />
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder={replyingTo ? "Yanıtınızı yazın..." : "Yorumunuzu yazın..."}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={[styles.sendCommentButton, !newComment.trim() && styles.sendButtonDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
                activeOpacity={0.8}
              >
                <Send size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>Henüz yorum yapılmamış</Text>
              <Text style={styles.noCommentsSubtext}>İlk yorumu siz yapın!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Survey Modal */}
      <Modal visible={showSurveyModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Anket: {survey?.title}</Text>
            <TouchableOpacity onPress={() => setShowSurveyModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.surveyDescription}>{survey?.description}</Text>
            
            {survey?.questions.map((question, index) => renderSurveyQuestion(question, index))}
            
            <TouchableOpacity
              style={styles.submitSurveyButton}
              onPress={handleSurveySubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitSurveyButtonText}>Cevapları Gönder</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  roleIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  postMeta: {
    alignItems: 'flex-end',
  },
  postTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postTitle: {
    fontSize: 16,
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
  mediaContainer: {
    marginBottom: 12,
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
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
  surveySection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  surveySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  surveyCompleted: {
    alignItems: 'center',
  },
  surveyCompletedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  surveyResponseCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  takeSurveyButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  takeSurveyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  surveyResults: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  surveyResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 12,
  },
  questionResult: {
    marginBottom: 16,
  },
  questionResultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  optionResults: {
    gap: 8,
  },
  optionResult: {
    marginBottom: 8,
  },
  optionResultText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  resultBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  resultPercentage: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    textAlign: 'right',
  },
  ratingResults: {
    gap: 6,
  },
  ratingResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingResultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    width: 30,
  },
  qaSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  qaSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  qaQuestion: {
    fontSize: 14,
    color: '#065F46',
    marginBottom: 16,
    fontWeight: '500',
  },
  qaOptionsVoting: {
    gap: 8,
    marginBottom: 12,
  },
  qaVoteOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qaOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qaOptionLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    width: 24,
  },
  qaOptionText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  qaVoteResults: {
    marginTop: 8,
  },
  qaResultBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  qaResultBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  qaResultText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'right',
  },
  qaVoteCount: {
    fontSize: 12,
    color: '#065F46',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eventSection: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  eventSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  registerEventButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  registerEventButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  replyIndicator: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginTop: 4,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 100,
    marginRight: 8,
  },
  sendCommentButton: {
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  commentContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  commentUserBranch: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  commentContent: {
    marginLeft: 40,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  replyButtonText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  repliesContainer: {
    marginLeft: 40,
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  replyContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyUserDetails: {
    flex: 1,
  },
  replyUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  replyUserBranch: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
  },
  replyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 6,
  },
  replyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  surveyQuestionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  surveyQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  required: {
    color: '#DC2626',
  },
  surveyTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  surveyOptionsContainer: {
    gap: 8,
  },
  modernSurveyOption: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  surveyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  surveyOptionLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  surveyOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedSurveyOption: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  surveyOptionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  selectedSurveyCircle: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  surveyOptionText: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
    fontWeight: '500',
  },
  selectedSurveyOptionText: {
    color: '#92400E',
    fontWeight: '600',
  },
  surveyCheckMark: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: '700',
  },
  submitSurveyButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitSurveyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    color: '#6B7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});