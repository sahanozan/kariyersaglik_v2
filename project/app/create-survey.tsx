import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Trash2, FileText, Calendar, BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isValidDateString, isDateInFuture } from '@/lib/utils';

interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating';
  question: string;
  options?: string[];
  required: boolean;
}

export default function CreateSurveyPage() {
  const { user } = useAuth();
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    expiresAt: '',
  });
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      type: 'text',
      question: '',
      required: true,
    }
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'text',
      question: '',
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    if (questions.length <= 1) {
      Alert.alert('Uyarı', 'En az bir soru olmalıdır');
      return;
    }
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { 
        ...q, 
        options: [...(q.options || []), ''] 
      } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt)
      } : q
    ));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options?.filter((_, idx) => idx !== optionIndex)
      } : q
    ));
  };

  const handleCreateSurvey = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!surveyData.title || !surveyData.description) {
      Alert.alert('Eksik Bilgi', 'Başlık ve açıklama zorunludur');
      return;
    }

    // Validate expiry date if provided
    if (surveyData.expiresAt) {
      if (!isValidDateString(surveyData.expiresAt)) {
        Alert.alert('Geçersiz Tarih', 'Son cevaplama tarihi YYYY-MM-DD formatında olmalıdır (örn: 2025-03-15)');
        return;
      }

      if (!isDateInFuture(surveyData.expiresAt)) {
        Alert.alert('Geçersiz Tarih', 'Son cevaplama tarihi gelecekte olmalıdır');
        return;
      }
    }

    const validQuestions = questions.filter(q => q.question.trim());
    if (validQuestions.length === 0) {
      Alert.alert('Eksik Bilgi', 'En az bir soru eklemelisiniz');
      return;
    }

    setLoading(true);
    
    try {
      const expiresAt = surveyData.expiresAt ? 
        `${surveyData.expiresAt}T23:59:59` : 
        null;

      const { error } = await supabase
        .from('surveys')
        .insert({
          user_id: user?.id || '',
          title: surveyData.title,
          description: surveyData.description,
          questions: validQuestions as any,
          expires_at: expiresAt,
          is_active: true
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Anketiniz oluşturuldu!', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating survey:', error);
      Alert.alert('Hata', 'Anket oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => (
    <View key={question.id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Soru {index + 1}</Text>
        <TouchableOpacity
          style={styles.removeQuestionButton}
          onPress={() => removeQuestion(question.id)}
        >
          <Trash2 size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Question Text */}
      <TextInput
        style={styles.questionInput}
        placeholder="Sorunuzu yazın..."
        value={question.question}
        onChangeText={(text) => updateQuestion(question.id, 'question', text)}
        placeholderTextColor="#9CA3AF"
      />

      {/* Question Type */}
      <View style={styles.questionTypeContainer}>
        <Text style={styles.questionTypeLabel}>Soru Tipi:</Text>
        <View style={styles.questionTypeButtons}>
          {[
            { type: 'text', label: 'Metin' },
            { type: 'multiple_choice', label: 'Çoktan Seçmeli' },
            { type: 'rating', label: 'Puanlama' },
          ].map((type) => (
            <TouchableOpacity
              key={type.type}
              style={[
                styles.typeButton,
                question.type === type.type && styles.activeTypeButton
              ]}
              onPress={() => updateQuestion(question.id, 'type', type.type)}
            >
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

      {/* Multiple Choice Options */}
      {question.type === 'multiple_choice' && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>Seçenekler:</Text>
          {question.options?.map((option, optionIndex) => (
            <View key={optionIndex} style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Seçenek ${optionIndex + 1}`}
                value={option}
                onChangeText={(text) => updateOption(question.id, optionIndex, text)}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.removeOptionButton}
                onPress={() => removeOption(question.id, optionIndex)}
              >
                <Trash2 size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addOptionButton}
            onPress={() => addOption(question.id)}
          >
            <Plus size={16} color="#7C3AED" />
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anket Oluştur</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Survey Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Anket Başlığı *</Text>
            <View style={styles.inputWrapper}>
              <BarChart3 size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Sağlık Çalışanları Memnuniyet Anketi"
                value={surveyData.title}
                onChangeText={(text) => setSurveyData({...surveyData, title: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Açıklama *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Anket hakkında bilgi verin..."
              value={surveyData.description}
              onChangeText={(text) => setSurveyData({...surveyData, description: text})}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Expiry Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Son Cevaplama Tarihi</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (boş bırakılabilir)"
                value={surveyData.expiresAt}
                onChangeText={(text) => setSurveyData({...surveyData, expiresAt: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Questions */}
          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>Sorular</Text>
            {questions.map((question, index) => renderQuestion(question, index))}
            
            <TouchableOpacity
              style={styles.addQuestionButton}
              onPress={addQuestion}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addQuestionText}>Yeni Soru Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateSurvey}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Anket Oluşturuluyor...' : 'Anket Oluştur'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  questionsSection: {
    marginTop: 24,
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
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
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
    fontWeight: '600',
    color: '#F59E0B',
  },
  removeQuestionButton: {
    padding: 4,
  },
  questionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionTypeContainer: {
    marginBottom: 12,
  },
  questionTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  questionTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTypeButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
    color: '#374151',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  removeOptionButton: {
    padding: 4,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  addOptionText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 4,
  },
  addQuestionButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  addQuestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
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
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});