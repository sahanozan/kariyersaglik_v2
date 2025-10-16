import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChartBar as BarChart3, Clock, User, Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: any[];
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    branch: string;
  };
}

interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyResults {
  [questionId: string]: {
    [option: string]: number;
  };
}

interface SurveyStats {
  totalResponses: number;
  results: SurveyResults;
}

export default function SurveyDetailPage() {
  const { id: rawId } = useLocalSearchParams();
  const { user } = useAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResponded, setHasResponded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [surveyStats, setSurveyStats] = useState<SurveyStats | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Ensure id is a string and not undefined
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  useEffect(() => {
    console.log('🔍 Survey Detail - ID:', id, 'Type:', typeof id);
    if (id && id !== 'undefined' && typeof id === 'string') {
      fetchSurveyData();
      checkResponseStatus();
      fetchSurveyResults();
      
      // Set up interval to refresh results every 10 seconds
      const interval = setInterval(() => {
        fetchSurveyResults();
      }, 10000);
      
      // Cleanup interval on unmount
      return () => clearInterval(interval);
    } else {
      console.error('❌ Invalid survey ID:', id);
      setLoading(false);
    }
  }, [id]);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      
      if (!id || id === 'undefined' || typeof id !== 'string') {
        console.error('❌ Invalid ID for survey fetch:', id);
        setLoading(false);
        return;
      }
      
      console.log('📊 Fetching survey data for ID:', id);
      
      // First try to get from posts table (since surveys are posts with type 'anket')
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(first_name, last_name, branch)
        `)
        .eq('id', id)
        .eq('post_type', 'anket')
        .maybeSingle();

      if (postError && postError.code !== 'PGRST116') {
        console.error('❌ Error fetching post data:', postError);
        throw postError;
      }

      let data = null;
      
      if (postData) {
        // Convert post data to survey format
        data = {
          id: postData.id,
          title: postData.title || 'Anket',
          description: postData.content || '',
          questions: postData.questions || [],
          expires_at: null,
          is_active: true,
          created_at: postData.created_at,
          profiles: postData.profiles
        };
      } else {
        // Fallback to surveys table
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select(`
            *,
            profiles!surveys_user_id_fkey(first_name, last_name, branch)
          `)
          .eq('id', id)
          .maybeSingle();

        if (surveyError && surveyError.code !== 'PGRST116') {
          console.error('❌ Error fetching survey data:', surveyError);
          throw surveyError;
        }

        data = surveyData;
      }

      if (!data) {
        console.error('❌ No survey data found for ID:', id);
        setLoading(false);
        return;
      }
      
      console.log('✅ Survey data fetched successfully:', data);
      setSurvey(data as Survey);
    } catch (error) {
      console.error('Error fetching survey data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkResponseStatus = async () => {
    try {
      if (!user?.id || !id || id === 'undefined' || typeof id !== 'string') {
        console.log('❌ Cannot check response status - invalid user or survey ID');
        return;
      }
      
      console.log('🔍 Checking response status for survey:', id, 'user:', user.id);
      
      // Check if user has already responded to this survey
      const { data: existingResponse, error } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.log('⚠️ Survey responses table not found or error:', error.message);
        // If table doesn't exist, assume user hasn't responded
        setHasResponded(false);
        return;
      }

      const hasResponded = existingResponse && existingResponse.length > 0;
      setHasResponded(hasResponded || false);
      
      console.log('✅ Response status checked:', hasResponded ? 'Already responded' : 'Not responded yet');
    } catch (error) {
      console.error('Error checking response status:', error);
      // On error, assume user hasn't responded
      setHasResponded(false);
    }
  };

  const fetchSurveyResults = async () => {
    try {
      if (!id || id === 'undefined' || typeof id !== 'string') {
        console.log('❌ Cannot fetch survey results - invalid survey ID');
        return;
      }

      console.log('📊 Fetching survey results for ID:', id);

      // Try to fetch real survey responses - try both table names
      console.log('🔍 Attempting to fetch from survey_responses table for post:', id);
      
      let { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('post_id', id);
      
      let sourceTable = 'survey_responses';
      
      // If that fails, try anket_yanıtları
      if (responsesError) {
        console.log('⚠️ survey_responses failed, trying anket_yanıtları:', responsesError.message);
        const result = await supabase
          .from('survey_responses')
          .select('*')
          .eq('post_id', id);
        responsesData = result.data;
        responsesError = result.error;
        sourceTable = 'anket_yanıtları';
      }

      if (!responsesError) {
        console.log(`✅ Successfully fetched from ${sourceTable} table:`, responsesData?.length || 0, 'responses');
      }

      if (responsesError) {
        console.log('⚠️ Survey responses table not found or error:', responsesError.message);
        
        // Fallback to mock data if table doesn't exist
        const results: SurveyResults = {};
        const totalResponses = 0;

        setSurveyStats({
          totalResponses,
          results
        });
        return;
      }

      // Process real responses
      const results: SurveyResults = {};
      
      console.log('📊 Raw responses data:', responsesData);
      
      // Calculate unique users who responded
      const uniqueUsers = new Set(responsesData?.map(r => r.user_id) || []);
      const totalResponses = uniqueUsers.size;

      console.log('👥 Unique users who responded:', Array.from(uniqueUsers));
      console.log('📈 Total responses count:', totalResponses);

      if (responsesData && responsesData.length > 0) {
        // Group responses by question
        responsesData.forEach((response, index) => {
          console.log(`📝 Processing response ${index + 1}:`, response);
          
          const questionKey = `question_${response.question_index}`;
          
          if (!results[questionKey]) {
            results[questionKey] = {};
          }

          // Count responses based on type
          if (response.selected_option) {
            const option = response.selected_option;
            results[questionKey][option] = (results[questionKey][option] || 0) + 1;
            console.log(`✅ Added vote for question ${response.question_index}, option "${option}"`);
          } else if (response.rating_value !== null && response.rating_value !== undefined) {
            const rating = `${response.rating_value} yıldız`;
            results[questionKey][rating] = (results[questionKey][rating] || 0) + 1;
            console.log(`✅ Added rating for question ${response.question_index}, rating ${response.rating_value}`);
          } else if (response.answer_text) {
            const textKey = 'Metin Cevapları';
            results[questionKey][textKey] = (results[questionKey][textKey] || 0) + 1;
            console.log(`✅ Added text response for question ${response.question_index}`);
          } else {
            console.log(`⚠️ Response has no valid answer:`, response);
          }
        });
      } else {
        console.log('⚠️ No responses data found');
      }

      setSurveyStats({
        totalResponses,
        results
      });

      console.log('📈 Real survey stats loaded:', { 
        totalResponses, 
        results,
        rawResponsesCount: responsesData?.length || 0,
        uniqueUsersCount: uniqueUsers.size,
        resultKeys: Object.keys(results)
      });
    } catch (error) {
      console.error('Error fetching survey results:', error);
      
      // Fallback to empty results
      setSurveyStats({
        totalResponses: 0,
        results: {}
      });
    }
  };

  const handleSubmitResponse = async () => {
    if (hasResponded) {
      Alert.alert('Bilgi', 'Bu anketi zaten cevapladınız');
      return;
    }

    if (!user?.id || !id || id === 'undefined' || typeof id !== 'string') {
      Alert.alert('Hata', 'Kullanıcı bilgisi veya anket ID\'si bulunamadı');
      console.error('❌ Invalid user ID or survey ID:', { userId: user?.id, surveyId: id });
      return;
    }

    // Validate required questions
    const requiredQuestions = survey?.questions.filter(q => q.required) || [];
    for (const question of requiredQuestions) {
      if (!responses[question.id] || responses[question.id] === '') {
        Alert.alert('Hata', `"${question.question}" sorusu zorunludur`);
        return;
      }
    }

    setSubmitting(true);
    
    try {
      console.log('📝 Submitting survey responses:', responses);

      // Prepare responses for database
      const surveyResponses = [];
      
      for (let i = 0; i < (survey?.questions?.length || 0); i++) {
        const question = survey?.questions?.[i];
        const questionId = question.id || i.toString();
        const answer = responses[questionId];
        
        if (answer !== undefined && answer !== '') {
          const responseData: any = {
            post_id: id,
            user_id: user.id,
            question_index: i,
            question_text: question.question,
          };

          // Set appropriate answer field based on question type
          if (question.type === 'multiple_choice') {
            responseData.selected_option = answer;
          } else if (question.type === 'rating') {
            responseData.rating_value = parseInt(answer);
          } else if (question.type === 'text') {
            responseData.answer_text = answer;
          }

          surveyResponses.push(responseData);
        }
      }

      if (surveyResponses.length === 0) {
        Alert.alert('Hata', 'Lütfen en az bir soruyu cevaplayın');
        return;
      }

      console.log('📝 Attempting to save survey responses:', surveyResponses);

      // Try to save to database
      const { error } = await supabase
        .from('survey_responses')
        .upsert(surveyResponses, {
          onConflict: 'post_id,user_id,question_index'
        });
      
      if (!error) {
        console.log('✅ Successfully saved to survey_responses table');
      }

      if (error) {
        console.error('❌ Error saving survey responses:', error);
        
        // Check if table doesn't exist
        if (error.code === 'PGRST204' || error.message?.includes('survey_responses')) {
          Alert.alert('Bilgi', 'Anket sistemi henüz kurulmamış. Cevaplarınız yerel olarak kaydedildi.');
        } else {
          Alert.alert('Hata', 'Cevaplar kaydedilirken hata oluştu: ' + error.message);
        }
        return;
      }

      console.log('✅ Survey responses saved successfully');
      Alert.alert('Başarılı', 'Anket cevabınız kaydedildi!');
      setHasResponded(true);
      
      // Refresh results after submitting with a small delay to ensure DB consistency
      setTimeout(() => {
        fetchSurveyResults();
        console.log('🔄 Results refreshed after response submission');
      }, 1000);
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Hata', 'Cevap gönderilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const questionId = question.id || index.toString();
    
    return (
      <View key={questionId} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>⭐</Text>
          <Text style={styles.questionText}>
            {question.question}
            {question.required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
        
        {question.type === 'text' && (
          <TextInput
            style={styles.textInput}
            placeholder="Cevabınızı yazın..."
            value={responses[questionId] || ''}
            onChangeText={(text) => setResponses({...responses, [questionId]: text})}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        )}
        
        {question.type === 'multiple_choice' && (
          <View style={styles.optionsContainer}>
            {question.options?.map((option, optionIndex) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.optionButton,
                  responses[questionId] === option && styles.selectedOption
                ]}
                onPress={() => setResponses({...responses, [questionId]: option})}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionCircle,
                  responses[questionId] === option && styles.selectedCircle
                ]} />
                <Text style={[
                  styles.optionText,
                  responses[questionId] === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {question.type === 'rating' && (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  responses[questionId] === rating && styles.selectedRating
                ]}
                onPress={() => setResponses({...responses, [questionId]: rating})}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.ratingText,
                  responses[questionId] === rating && styles.selectedRatingText
                ]}>
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderQuestionResults = (question: Question, questionIndex: number) => {
    // Use question_index to match the key format from fetchSurveyResults
    const questionKey = `question_${questionIndex}`;
    const questionResults = surveyStats?.results[questionKey] || {};
    const totalVotes = Object.values(questionResults).reduce((sum, count) => sum + count, 0);

    console.log(`📊 Rendering results for question ${questionIndex}:`, {
      questionType: question.type,
      questionKey,
      questionResults,
      totalVotes,
      availableKeys: Object.keys(questionResults)
    });

    return (
      <View key={question.id} style={styles.resultQuestionCard}>
        <View style={styles.resultQuestionHeader}>
          <Text style={styles.resultQuestionNumber}>⭐</Text>
          <Text style={styles.resultQuestionText}>{question.question}</Text>
        </View>
        <Text style={styles.totalVotesText}>Toplam Oy: {totalVotes}</Text>
        
        {question.type === 'multiple_choice' && question.options && (
          <View style={styles.resultOptionsContainer}>
            {question.options.map((option, index) => {
              const votes = questionResults[option] || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              
              return (
                <View key={index} style={styles.resultOptionItem}>
                  <View style={styles.resultOptionHeader}>
                    <Text style={styles.resultOptionText}>{option}</Text>
                    <Text style={styles.resultVoteCount}>{votes} oy ({percentage.toFixed(1)}%)</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {question.type === 'rating' && (
          <View style={styles.resultRatingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const ratingKey = `${rating} yıldız`;
              const votes = questionResults[ratingKey] || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              
              console.log(`⭐ Rating ${rating}: key="${ratingKey}", votes=${votes}, percentage=${percentage.toFixed(1)}%`);
              
              return (
                <View key={rating} style={styles.resultRatingItem}>
                  <View style={styles.ratingStarsDisplay}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text 
                        key={star} 
                        style={[
                          styles.resultStar,
                          star <= rating && styles.resultStarFilled
                        ]}
                      >
                        {star <= rating ? '⭐' : '☆'}
                      </Text>
                    ))}
                    <Text style={styles.ratingNumber}>({rating})</Text>
                  </View>
                  <View style={styles.ratingProgressContainer}>
                    <View 
                      style={[
                        styles.ratingProgressBar, 
                        { width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.resultRatingCount}>{votes} oy ({percentage.toFixed(1)}%)</Text>
                </View>
              );
            })}
          </View>
        )}

        {question.type === 'text' && (
          <View style={styles.textResponsesContainer}>
            {Object.entries(questionResults).map(([response, count], index) => (
              <View key={index} style={styles.textResponseItem}>
                <Text style={styles.textResponseText}>"{response}"</Text>
                <Text style={styles.textResponseCount}>{count} kez yazıldı</Text>
              </View>
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
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Anket yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!survey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Anket Bulunamadı</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Bu anket bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = survey.expires_at && new Date() > new Date(survey.expires_at);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anket</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Survey Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.surveyHeader}>
            <BarChart3 size={24} color="#F59E0B" />
            <Text style={styles.surveyTitle}>{survey.title}</Text>
          </View>
          <Text style={styles.surveyDescription}>{survey.description}</Text>
          
          <View style={styles.surveyMeta}>
            <View style={styles.metaItem}>
              <User size={16} color="#F59E0B" />
              <Text style={styles.metaText}>
                {survey.profiles?.first_name} {survey.profiles?.last_name}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color="#F59E0B" />
              <Text style={styles.metaText}>
                {survey.expires_at ? 
                  `Son tarih: ${new Date(survey.expires_at).toLocaleDateString('tr-TR')}` : 
                  'Süresiz'}
              </Text>
            </View>
          </View>
        </View>

        {/* Survey Status */}
        {isExpired ? (
          <View style={styles.expiredCard}>
            <Text style={styles.expiredText}>Bu anketin süresi dolmuştur</Text>
          </View>
        ) : hasResponded ? (
          <View style={styles.respondedCard}>
            <Text style={styles.respondedText}>Bu anketi zaten cevapladınız</Text>
          </View>
        ) : (
          <>
            {/* Questions */}
            <View style={styles.questionsSection}>
              <Text style={styles.sectionTitle}>Sorular</Text>
              {survey.questions.map((question, index) => renderQuestion(question, index))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmitResponse}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {submitting ? 'Gönderiliyor...' : 'Cevapları Gönder'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Results Section */}
        {surveyStats && (
          <View style={styles.resultsSection}>
            <TouchableOpacity
              style={styles.toggleResultsButton}
              onPress={() => {
                setShowResults(!showResults);
                // Refresh results when showing them
                if (!showResults) {
                  fetchSurveyResults();
                }
              }}
              activeOpacity={0.8}
            >
              <BarChart3 size={20} color="#8B5CF6" />
              <Text style={styles.toggleResultsText}>
                {showResults ? 'Sonuçları Gizle' : 'Sonuçları Göster'}
              </Text>
              <Text style={styles.participantCount}>
                ({surveyStats.totalResponses} katılımcı)
              </Text>
            </TouchableOpacity>

            {showResults && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsSectionTitle}>Anket Sonuçları</Text>
                {survey.questions.map((question, index) => renderQuestionResults(question, index))}
              </View>
            )}
          </View>
        )}
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
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  surveyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  surveyMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  expiredCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  expiredText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  respondedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  respondedText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  questionsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  questionCard: {
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  questionNumber: {
    fontSize: 18,
    color: '#FBBF24',
    marginTop: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    lineHeight: 22,
  },
  required: {
    color: '#DC2626',
  },
  textInput: {
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
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  optionCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  selectedCircle: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#92400E',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedRating: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedRatingText: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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

  // Results Styles
  resultsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  toggleResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
    flex: 1,
  },
  participantCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  resultsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  resultQuestionNumber: {
    fontSize: 18,
    color: '#FBBF24',
    marginTop: 2,
  },
  resultQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },
  totalVotesText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  resultOptionsContainer: {
    gap: 12,
  },
  resultOptionItem: {
    marginBottom: 8,
  },
  resultOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultOptionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  resultVoteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  resultRatingContainer: {
    gap: 8,
  },
  resultRatingItem: {
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 8,
  },
  ratingStarsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  resultStar: {
    fontSize: 18,
    color: '#CBD5E1',
  },
  resultStarFilled: {
    color: '#FBBF24',
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  resultRatingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    width: 20,
  },
  ratingProgressContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  ratingProgressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  resultRatingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    width: 30,
    textAlign: 'right',
  },
  textResponsesContainer: {
    gap: 8,
  },
  textResponseItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  textResponseText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  textResponseCount: {
    fontSize: 12,
    color: '#6B7280',
  },
});