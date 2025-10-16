import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  TextInput,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { Settings, MapPin, Building, Users, CreditCard as Edit, Camera, Shield, Key, Download, Trash2 } from 'lucide-react-native';
import { Mail } from 'lucide-react-native';
import { FileText } from 'lucide-react-native';
import { LogOut, Snowflake } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { getFriendCount } from '@/lib/friendUtils';
import AdvertisementBanner from '@/components/AdvertisementBanner';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    city: '',
    institution: '',
    about: '',
    avatar_url: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    rating: 5,
    feedback_type: 'general',
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [userProfile] = useState({
    name: 'Kullanıcı', // Will be updated from database
    title: 'İlk ve Acil Yardım Teknikeri',
    institution: 'Kurum Bilgisi Yok', // Will be updated from database
    city: 'Şehir Bilgisi Yok', // Will be updated from database
    about: 'Acil tıp alanında 5 yıllık deneyime sahip, hasta bakımı ve acil müdahale konularında uzmanlaşmış bir sağlık profesyoneliyim.',
    avatar: 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  });


  // Fetch real data from database
  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  const fetchCounts = async () => {
    try {
      if (user?.id) {
        const friendCount = await getFriendCount(user.id);
        setFriendCount(friendCount);
        
        // Get posts count
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (postsError) {
          console.error('Error fetching posts count:', postsError);
        } else {
          setPostsCount(postsCount || 0);
        }
        
        // Get job applications count
        const { count: applicationsCount, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (applicationsError) {
          console.error('Error fetching applications count:', applicationsError);
        } else {
          setApplicationsCount(applicationsCount || 0);
        }
      }
    } catch (error) {
      console.error('Error in fetchCounts:', error);
      // Set default values on error
      setFriendCount(0);
      setPostsCount(0);
      setApplicationsCount(0);
    }
  };

  const fetchCurrentUserData = async () => {
    try {
      console.log('🔍 Profile: Fetching user data for ID:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      
      console.log('🔍 Profile: Fetched user data:', data);
      console.log('🔍 Profile: User role:', data?.role);
      
      if (data) {
        setCurrentUserData(data);
        setEditForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          city: data.city || '',
          institution: data.institution || '',
          about: data.about || userProfile.about,
          avatar_url: data.avatar_url || '',
        });
      } else {
        console.log('❌ Profile: No user data found');
        // No profile found, initialize with empty values
        setCurrentUserData(null);
        setEditForm({
          first_name: '',
          last_name: '',
          city: '',
          institution: '',
          about: userProfile.about,
          avatar_url: '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch current user data from Supabase
  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
    }
  }, [user]);

  const handleEditProfile = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          city: editForm.city,
          institution: editForm.institution,
          about: editForm.about,
          avatar_url: editForm.avatar_url,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi!');
      setShowEditModal(false);
      fetchCurrentUserData(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken hata oluştu');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Şifre değiştirilirken hata oluştu: ${errorMessage}`);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) {
      Alert.alert('Hata', 'Lütfen konu ve mesaj alanlarını doldurun');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    setSubmittingFeedback(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          subject: feedbackForm.subject.trim(),
          message: feedbackForm.message.trim(),
          rating: feedbackForm.rating,
          feedback_type: feedbackForm.feedback_type,
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Geri bildiriminiz başarıyla gönderildi! Teşekkür ederiz.');
      setShowFeedbackModal(false);
      setFeedbackForm({
        subject: '',
        message: '',
        rating: 5,
        feedback_type: 'general',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Geri bildirim gönderilirken hata oluştu: ${errorMessage}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      console.log('📸 Starting profile image picker...');
      
      Alert.alert(
        'Profil Fotoğrafı',
        'Fotoğraf kaynağını seçin:',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Kamera', onPress: () => openCamera() },
          { text: 'Galeri', onPress: () => openGallery() },
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Hata', 'İzin alınırken hata oluştu');
    }
  };

  const promptForProfileImageUrl = () => {
    Alert.prompt(
      'Profil Fotoğrafı URL',
      'Profil fotoğrafı URL\'sini girin:',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Güncelle', 
          onPress: (url) => {
            if (url && url.trim()) {
              updateProfileImageFromUrl(url.trim());
            } else {
              Alert.alert('Hata', 'Geçerli bir URL girin');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const updateProfileImageFromUrl = async (imageUrl: string) => {
    try {
      console.log('📸 Updating profile image from URL:', imageUrl);
      
      // Validate URL
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        Alert.alert('Hata', 'Geçerli bir URL girin (http:// veya https:// ile başlamalı)');
        return;
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id || '');

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi!');
      fetchCurrentUserData(); // Refresh data
      console.log('✅ Profile image updated from URL');
    } catch (error) {
      console.error('Error updating profile image from URL:', error);
      Alert.alert('Hata', 'Profil fotoğrafı güncellenirken hata oluştu');
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
        aspect: [1, 1],
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Hata', 'Galeri açılırken hata oluştu');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      // Create a unique filename
      const fileName = `avatar_${user?.id}_${Date.now()}.jpg`;
      
      // Convert image to blob for web, or use file for mobile
      let imageFile;
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        imageFile = await response.blob();
      } else {
        // For mobile, create FormData
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any);
        imageFile = formData;
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user?.id}/${fileName}`, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user?.id}/${fileName}`);

      if (urlData?.publicUrl) {
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user?.id || '');

        if (updateError) {
          throw updateError;
        }

        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi!');
        fetchCurrentUserData(); // Refresh data
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken hata oluştu');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz silinecek.\n\nEmin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Son Onay',
              'Hesabınızı silmek için "SİL" yazın:',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Devam Et',
                  style: 'destructive',
                  onPress: () => {
                    // Show a prompt for confirmation
                    Alert.prompt(
                      'Hesap Silme Onayı',
                      'Hesabınızı silmek için "SİL" yazın:',
                      [
                        { text: 'İptal', style: 'cancel' },
                        {
                          text: 'Hesabı Sil',
                          style: 'destructive',
                          onPress: async (inputText) => {
                            if (inputText?.toUpperCase() === 'SİL') {
                              try {
                                const userId = user?.id;
                                if (!userId) {
                                  throw new Error('Kullanıcı ID bulunamadı');
                                }

                                console.log('🗑️ Starting account deletion for user:', userId);

                                // Delete all related data
                                const deleteOperations = [
                                  // Chat data
                                  supabase.from('chat_messages').delete().eq('user_id', userId),
                                  supabase.from('chat_room_members').delete().eq('user_id', userId),
                                  
                                  // Friend data
                                  supabase.from('friend_requests').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
                                  supabase.from('friendships').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
                                  
                                  // Private messages
                                  supabase.from('private_messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
                                  
                                  // Posts and content
                                  supabase.from('posts').delete().eq('user_id', userId),
                                  supabase.from('job_applications').delete().eq('user_id', userId),
                                  supabase.from('event_registrations').delete().eq('user_id', userId),
                                  supabase.from('survey_responses').delete().eq('user_id', userId),
                                  
                                  // CV data
                                  supabase.from('cvs').delete().eq('user_id', userId),
                                  
                                  // Profile (last)
                                  supabase.from('profiles').delete().eq('id', userId)
                                ];

                                // Execute all delete operations
                                for (const operation of deleteOperations) {
                                  const { error } = await operation;
                                  if (error) {
                                    console.warn('⚠️ Delete operation warning:', error);
                                    // Continue with other operations even if one fails
                                  }
                                }

                                console.log('✅ All data deleted successfully');

                                // Sign out user
                                await signOut();
                                Alert.alert('Başarılı', 'Hesabınız ve tüm verileriniz başarıyla silindi');
                                router.replace('/auth/login');
                              } catch (error) {
                                console.error('Error deleting account:', error);
                                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
                                Alert.alert('Hata', `Hesap silinirken hata oluştu: ${errorMessage}`);
                              }
                            } else {
                              Alert.alert('Hata', 'Onay metni yanlış. Hesap silinmedi.');
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleFreezeAccount = () => {
    Alert.alert(
      'Hesabı Dondur',
      'Hesabınızı geçici olarak dondurmak istediğinizden emin misiniz?\n\nDondurulmuş hesaplar:\n• Giriş yapamaz\n• Mesaj alamaz\n• Paylaşım yapamaz\n\nHesabınızı yeniden aktifleştirmek için destek ekibiyle iletişime geçmeniz gerekir.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Dondur', 
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Son Onay',
              'Hesabınızı dondurmak için "DONDUR" yazın:',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Devam Et',
                  style: 'destructive',
                  onPress: () => {
                    Alert.prompt(
                      'Hesap Dondurma Onayı',
                      'Hesabınızı dondurmak için "DONDUR" yazın:',
                      [
                        { text: 'İptal', style: 'cancel' },
                        {
                          text: 'Hesabı Dondur',
                          style: 'destructive',
                          onPress: async (inputText) => {
                            if (inputText?.toUpperCase() === 'DONDUR') {
                              try {
                                const { error } = await supabase
                                  .from('profiles')
                                  .update({ 
                                    is_blocked: true,
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('id', user?.id || '');

                                if (error) throw error;

                                Alert.alert(
                                  'Hesap Donduruldu', 
                                  'Hesabınız başarıyla donduruldu. Yeniden aktifleştirmek için kariyersaglik@outlook.com adresine e-posta gönderin.',
                                  [
                                    { 
                                      text: 'Tamam', 
                                      onPress: async () => {
                                        await signOut();
                                        router.replace('/auth/login');
                                      }
                                    }
                                  ]
                                );
                              } catch (error) {
                                console.error('Error freezing account:', error);
                                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
                                Alert.alert('Hata', `Hesap dondurulurken hata oluştu: ${errorMessage}`);
                              }
                            } else {
                              Alert.alert('Hata', 'Onay metni yanlış. Hesap dondurulmadı.');
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };


  const downloadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .single();

      if (error) throw error;

      // Create a formatted data string
      const userData = {
        'Ad Soyad': `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        'E-posta': data.email || '',
        'Branş': data.branch || '',
        'Şehir': data.city || '',
        'Kurum': data.institution || '',
        'Rol': data.role || 'user',
        'Hakkında': data.about || '',
        'Kayıt Tarihi': data.created_at ? new Date(data.created_at).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : '',
        'Son Güncelleme': data.updated_at ? new Date(data.updated_at).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : '',
        'Son Giriş': data.last_login ? new Date(data.last_login).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : 'Bilinmiyor'
      };

      const formattedData = Object.entries(userData)
        .map(([key, value]) => `${key}: ${value || 'Belirtilmemiş'}`)
        .join('\n');

      Alert.alert(
        'Kişisel Verileriniz',
        formattedData,
        [
          { text: 'Kapat', style: 'cancel' },
          { 
            text: 'Kopyala', 
            onPress: () => {
              // For web, try to copy to clipboard
              if (Platform.OS === 'web' && navigator.clipboard) {
                navigator.clipboard.writeText(formattedData)
                  .then(() => Alert.alert('Başarılı', 'Verileriniz panoya kopyalandı!'))
                  .catch(() => Alert.alert('Bilgi', 'Verileriniz yukarıda görüntüleniyor'));
              } else {
                Alert.alert('Bilgi', 'Verileriniz yukarıda görüntüleniyor');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error downloading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Veri indirilirken hata oluştu: ${errorMessage}`);
    }
  };

  // Ünvan kısaltmaları
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

  // Tam isim formatı
  const getFormattedName = (firstName: string, lastName: string, branch: string) => {
    return `${firstName} ${lastName.toUpperCase()}`;
  };

  const settingsOptions = [
    {
      id: 'edit',
      title: 'Profili Düzenle',
      icon: Edit,
      onPress: () => setShowEditModal(true),
    },
    {
      id: 'photo',
      title: 'Profil Fotoğrafını Değiştir',
      icon: Camera,
      onPress: handleImagePicker,
    },
    {
      id: 'password',
      title: 'Şifre Değiştir',
      icon: Key,
      onPress: () => setShowPasswordModal(true),
    },
    {
      id: 'data',
      title: 'Verilerimi İndir',
      icon: Download,
      onPress: downloadUserData,
    },
    {
      id: 'privacy',
      title: 'Gizlilik Politikası',
      icon: Shield,
      onPress: () => router.push('/privacy-policy'),
    },
    {
      id: 'terms',
      title: 'Kullanım Şartları',
      icon: FileText,
      onPress: () => router.push('/terms-of-service'),
    },
    {
      id: 'about',
      title: 'Hakkımızda',
      icon: Users,
      onPress: () => setShowAboutModal(true),
    },
    {
      id: 'notifications',
      title: 'Bildirim Ayarları',
      icon: Settings,
      onPress: () => router.push('/notification-settings'),
    },
    {
      id: 'logout',
      title: 'Çıkış Yap',
      icon: LogOut,
      onPress: () => {
        Alert.alert(
          'Çıkış Yap',
          'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Çıkış Yap', 
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('Signing out...');
                  await signOut();
                  console.log('Sign out completed, redirecting...');
                  router.replace('/auth/login');
                } catch (error) {
                  console.error('Logout error:', error);
                  // Force redirect even on error
                  router.replace('/auth/login');
                }
              }
            }
          ]
        );
      },
    },
    {
      id: 'freeze',
      title: 'Hesabımı Dondur',
      icon: Snowflake,
      onPress: handleFreezeAccount,
      danger: true,
    },
    {
      id: 'delete',
      title: 'Hesabı Sil',
      icon: Trash2,
      onPress: handleDeleteAccount,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoContainerInner}>
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
          activeOpacity={0.7}
        >
          <Settings size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings Menu */}
        {showSettings && (
          <View style={styles.settingsMenu}>
            <Text style={styles.settingsTitle}>Ayarlar</Text>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.settingsOption,
                  option.danger && styles.dangerOption,
                ]}
                onPress={option.onPress}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
              >
                {(() => {
                  const IconComponent = option.icon;
                  return (
                    <IconComponent 
                      size={20} 
                      color={option.danger ? '#DC2626' : '#374151'} 
                    />
                  );
                })()}
                <Text 
                  style={[
                    styles.settingsOptionText,
                    option.danger && styles.dangerText,
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Profile Card - Role-based styling */}
        {currentUserData?.role === 'admin' ? (
          <View style={[styles.adminProfileCard, showSettings && styles.profileCardShifted]}>
            {/* Admin Crown Header */}
            <View style={styles.adminCrownHeader}>
              <View style={styles.adminCrown}>
                <Text style={styles.adminCrownText}>👑</Text>
              </View>
              <Text style={styles.adminHeaderText}>YÖNETİCİ</Text>
            </View>
            
            <Image
              source={{
                uri: currentUserData?.avatar_url || userProfile.avatar
              }}
              style={styles.adminAvatar}
            />
            <View style={styles.adminProfileInfo}>
              <Text style={styles.adminProfileName}>
                {currentUserData ? 
                  `${currentUserData.first_name} ${currentUserData.last_name.toUpperCase()}` : 
                  userProfile.name}
              </Text>
              <Text style={styles.adminProfileTitle}>
                {currentUserData?.branch || userProfile.title}
              </Text>
              
              {/* Admin Status */}
              <View style={styles.adminStatusBadge}>
                <Shield size={16} color="#FFFFFF" />
                <Text style={styles.adminStatusText}>SÜPER YÖNETİCİ</Text>
              </View>
              
              <View style={styles.adminLocationInfo}>
                <Building size={16} color="#FFFFFF" />
                <Text style={styles.adminInstitution}>
                  {currentUserData?.institution || userProfile.institution}
                </Text>
              </View>
              <View style={styles.adminLocationInfo}>
                <MapPin size={16} color="#FFFFFF" />
                <Text style={styles.adminCity}>
                  {currentUserData?.city || userProfile.city}
                </Text>
              </View>
              
              {/* Admin Powers */}
              <View style={styles.adminPowersSection}>
                <Text style={styles.adminPowersTitle}>YETKİLER</Text>
                <View style={styles.adminPowersList}>
                  <Text style={styles.adminPowerItem}>• Tüm kullanıcıları yönetebilir</Text>
                  <Text style={styles.adminPowerItem}>• Sistem ayarlarını değiştirebilir</Text>
                  <Text style={styles.adminPowerItem}>• Moderator atayabilir</Text>
                  <Text style={styles.adminPowerItem}>• Tüm içerikleri silebilir</Text>
                </View>
              </View>
            </View>
          </View>
        ) : currentUserData?.role === 'moderator' ? (
          <View style={[styles.moderatorProfileCard, showSettings && styles.profileCardShifted]}>
            {/* Moderator Shield Header */}
            <View style={styles.moderatorShieldHeader}>
              <View style={styles.moderatorShield}>
                <Shield size={20} color="#059669" />
              </View>
              <Text style={styles.moderatorHeaderText}>MODERATÖR</Text>
            </View>
            
            <Image
              source={{
                uri: currentUserData?.avatar_url || userProfile.avatar
              }}
              style={styles.moderatorAvatar}
            />
            <View style={styles.moderatorProfileInfo}>
              <Text style={styles.moderatorProfileName}>
                {currentUserData ? 
                  `${currentUserData.first_name} ${currentUserData.last_name.toUpperCase()}` : 
                  userProfile.name}
              </Text>
              <Text style={styles.moderatorProfileTitle}>
                {currentUserData?.branch || userProfile.title}
              </Text>
              
              {/* Moderator Status */}
              <View style={styles.moderatorStatusBadge}>
                <Shield size={14} color="#FFFFFF" />
                <Text style={styles.moderatorStatusText}>MODERATÖR</Text>
              </View>
              
              <View style={styles.moderatorLocationInfo}>
                <Building size={16} color="#059669" />
                <Text style={styles.moderatorInstitution}>
                  {currentUserData?.institution || userProfile.institution}
                </Text>
              </View>
              <View style={styles.moderatorLocationInfo}>
                <MapPin size={16} color="#059669" />
                <Text style={styles.moderatorCity}>
                  {currentUserData?.city || userProfile.city}
                </Text>
              </View>
              
              {/* Moderator Powers */}
              <View style={styles.moderatorPowersSection}>
                <Text style={styles.moderatorPowersTitle}>YETKİLER</Text>
                <View style={styles.moderatorPowersList}>
                  <Text style={styles.moderatorPowerItem}>• Mesajları yönetebilir</Text>
                  <Text style={styles.moderatorPowerItem}>• Kullanıcıları engelleyebilir</Text>
                  <Text style={styles.moderatorPowerItem}>• İçerikleri silebilir</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.profileCard, showSettings && styles.profileCardShifted]}>
            <TouchableOpacity onPress={handleImagePicker}>
              <Image
                source={{
                  uri: currentUserData?.avatar_url || userProfile.avatar
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {currentUserData ? 
                  `${currentUserData.first_name} ${currentUserData.last_name.toUpperCase()}` : 
                  userProfile.name}
              </Text>
              <Text style={styles.profileTitleRed}>
                {currentUserData?.branch || userProfile.title}
              </Text>
              <View style={styles.locationInfo}>
                <Building size={16} color="#6B7280" />
                <Text style={styles.institution}>
                  {currentUserData?.institution || userProfile.institution}
                </Text>
              </View>
              <View style={styles.locationInfo}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.city}>
                  {currentUserData?.city || userProfile.city}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CV/Özgeçmiş Button */}
        <TouchableOpacity 
          style={styles.cvButton}
          onPress={() => router.push('/cv-builder')}
          activeOpacity={0.7}
        >
          <FileText size={20} color="#FFFFFF" />
          <Text style={styles.cvButtonText}>CV / Özgeçmiş</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/friends-list')}
            activeOpacity={0.7}
            onLongPress={fetchCounts}
          >
            <Text style={styles.statNumber}>{friendCount}</Text>
            <Text style={styles.statLabel}>Arkadaş</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/my-posts')}
            activeOpacity={0.7}
            onLongPress={fetchCounts}
          >
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>Paylaşım</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/my-job-applications')}
            activeOpacity={0.7}
            onLongPress={fetchCounts}
          >
            <Text style={styles.statNumber}>{applicationsCount}</Text>
            <Text style={styles.statLabel}>Başvuru</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Hakkında</Text>
          <Text style={styles.aboutText}>
            {currentUserData?.about || userProfile.about}
          </Text>
        </View>

        {/* CV/Özgeçmiş Button */}
        <View style={styles.recentPosts}>
          <Text style={styles.sectionTitle}>Kişi Prospektüsü</Text>
          <View style={styles.postItem}>
            <Text style={styles.postTitle}>Acil Müdahale Protokolü</Text>
            <Text style={styles.postContent}>
              Kardiyopulmoner resüsitasyon sırasında dikkat edilmesi gereken temel prensipler...
            </Text>
            <Text style={styles.postTime}>2 saat önce</Text>
          </View>
          <View style={styles.postItem}>
            <Text style={styles.postTitle}>Soru: IV Kateter Boyutu</Text>
            <Text style={styles.postContent}>
              Pediatrik hastalarda hangi boyut IV kateter kullanıyorsunuz?
            </Text>
            <Text style={styles.postTime}>1 gün önce</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ad</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={editForm.first_name}
                  editable={false}
                  placeholder="Adınız"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>Ad değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Soyad</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={editForm.last_name}
                  editable={false}
                  placeholder="Soyadınız"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>Soyad değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Branş</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={currentUserData?.branch || ''}
                  editable={false}
                  placeholder="Branşınız"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>Branş değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-posta Adresi</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={currentUserData?.email || ''}
                  editable={false}
                  placeholder="E-posta adresi"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>E-posta adresi değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şehir</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.city}
                onChangeText={(text) => setEditForm({...editForm, city: text})}
                placeholder="Çalıştığınız şehir"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kurum</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.institution}
                onChangeText={(text) => setEditForm({...editForm, institution: text})}
                placeholder="Çalıştığınız kurum"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hakkında</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={editForm.about}
                onChangeText={(text) => setEditForm({...editForm, about: text})}
                placeholder="Kendiniz hakkında bilgi"
                multiline
                numberOfLines={4}
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleEditProfile}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mevcut Şifre</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                placeholder="Mevcut şifreniz"
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yeni Şifre</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                placeholder="Yeni şifreniz"
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yeni Şifre Tekrar</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                placeholder="Yeni şifrenizi tekrar girin"
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>Şifreyi Değiştir</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* About Us Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <SafeAreaView style={styles.aboutModalContainer}>
          <View style={styles.aboutModalHeader}>
            <Text style={styles.aboutModalTitle}>Kariyer Sağlık Hakkında</Text>
            <TouchableOpacity
              style={styles.aboutModalCloseButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.aboutModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.aboutModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.aboutLogoContainer}>
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={styles.aboutLogo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.aboutMainText}>
              Kariyer Sağlık, sağlık profesyonelleri ve öğrenciler için geliştirilmiş modern bir mobil platformdur.
            </Text>
            
            <Text style={styles.aboutSubText}>
              Amacımız; sağlık çalışanlarını tek bir dijital çatı altında buluşturmak, güvenilir iş ilanlarına erişim sağlamak, branşlara özel sohbet odalarıyla mesleki dayanışmayı güçlendirmek ve çevrimdışı ilaç prospektüsleri ile tedavi algoritmalarına her an erişim sunmaktır.
            </Text>
            
            <Text style={styles.aboutSubText}>
              Uygulama; iş ilanları, profesyonel sohbet odaları, kişisel profiller, arkadaşlık & mesajlaşma sistemi ve paylaşım alanlarıyla sağlık alanında kapsamlı bir kariyer ve iletişim ağı oluşturur.
            </Text>
            
            <View style={styles.aboutContactContainer}>
              <Text style={styles.aboutContactTitle}>📩 Destek için:</Text>
              <TouchableOpacity 
                onPress={() => Linking.openURL('mailto:kariyersaglik@outlook.com')}
                activeOpacity={0.7}
              >
                <Text style={styles.aboutContactEmail}>kariyersaglik@outlook.com</Text>
              </TouchableOpacity>
              
              <Text style={styles.aboutContactTitle}>📷 Instagram:</Text>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.instagram.com/kariyer.saglik/')}
                activeOpacity={0.7}
              >
                <Text style={styles.aboutContactInstagram}>@kariyer.saglik</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.aboutTaglineContainer}>
              <Text style={styles.aboutTagline}>
                Kariyer Sağlık – Sağlıkta kariyer, burada başlar.
              </Text>
            </View>
            
            <View style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackIcon}>💬</Text>
                <Text style={styles.feedbackTitle}>Geri Bildirim</Text>
              </View>
              <Text style={styles.feedbackDescription}>
                Uygulamamızı geliştirmek için görüşleriniz bizim için çok değerli. 
                Deneyimlerinizi, önerilerinizi ve geri bildirimlerinizi bizimle paylaşın.
              </Text>
              <TouchableOpacity 
                style={styles.feedbackButton}
                onPress={() => setShowFeedbackModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.feedbackButtonText}>Geri Bildirim Gönder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <SafeAreaView style={styles.feedbackModalContainer}>
          <View style={styles.feedbackModalHeader}>
            <Text style={styles.feedbackModalTitle}>Geri Bildirim Gönder</Text>
            <TouchableOpacity
              style={styles.feedbackModalCloseButton}
              onPress={() => setShowFeedbackModal(false)}
            >
              <Text style={styles.feedbackModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.feedbackModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.feedbackFormContainer}>
              <Text style={styles.feedbackLabel}>Konu *</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Geri bildiriminizin konusunu yazın"
                value={feedbackForm.subject}
                onChangeText={(text) => setFeedbackForm(prev => ({ ...prev, subject: text }))}
                maxLength={100}
              />
              
              <Text style={styles.feedbackLabel}>Geri Bildirim Türü</Text>
              <View style={styles.feedbackTypeContainer}>
                {[
                  { key: 'general', label: 'Genel', icon: '💬' },
                  { key: 'bug_report', label: 'Hata Bildirimi', icon: '🐛' },
                  { key: 'feature_request', label: 'Özellik İsteği', icon: '💡' },
                  { key: 'complaint', label: 'Şikayet', icon: '😞' },
                  { key: 'compliment', label: 'Övgü', icon: '😊' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.feedbackTypeOption,
                      feedbackForm.feedback_type === type.key && styles.feedbackTypeOptionSelected
                    ]}
                    onPress={() => setFeedbackForm(prev => ({ ...prev, feedback_type: type.key }))}
                  >
                    <Text style={styles.feedbackTypeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.feedbackTypeText,
                      feedbackForm.feedback_type === type.key && styles.feedbackTypeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.feedbackLabel}>Değerlendirme</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                    style={styles.starButton}
                  >
                    <Text style={[
                      styles.star,
                      star <= feedbackForm.rating ? styles.starFilled : styles.starEmpty
                    ]}>
                      ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingText}>
                  {feedbackForm.rating === 1 && 'Çok Kötü'}
                  {feedbackForm.rating === 2 && 'Kötü'}
                  {feedbackForm.rating === 3 && 'Orta'}
                  {feedbackForm.rating === 4 && 'İyi'}
                  {feedbackForm.rating === 5 && 'Mükemmel'}
                </Text>
              </View>
              
              <Text style={styles.feedbackLabel}>Mesaj *</Text>
              <TextInput
                style={[styles.feedbackInput, styles.feedbackTextArea]}
                placeholder="Geri bildiriminizi detaylı olarak yazın..."
                value={feedbackForm.message}
                onChangeText={(text) => setFeedbackForm(prev => ({ ...prev, message: text }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.characterCount}>
                {feedbackForm.message.length}/1000 karakter
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.feedbackModalFooter}>
            <TouchableOpacity
              style={styles.feedbackCancelButton}
              onPress={() => setShowFeedbackModal(false)}
            >
              <Text style={styles.feedbackCancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.feedbackSubmitButton, submittingFeedback && styles.feedbackSubmitButtonDisabled]}
              onPress={handleSubmitFeedback}
              disabled={submittingFeedback}
            >
              <Text style={styles.feedbackSubmitButtonText}>
                {submittingFeedback ? 'Gönderiliyor...' : 'Gönder'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainerInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 100,
    maxHeight: 100,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  logoTextAccent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
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
  profileCardShifted: {
    marginTop: 0,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  profileTitleRed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  institution: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  city: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  cvButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cvButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    flexDirection: 'row',
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  aboutSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  friendsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  friendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  settingsMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  settingsOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerOption: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dangerText: {
    color: '#DC2626',
  },
  recentPosts: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  postItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'center',
  },
  adminRoleBadge: {
    backgroundColor: '#DC2626',
  },
  moderatorRoleBadge: {
    backgroundColor: '#059669',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  lockedInputContainer: {
    position: 'relative',
  },
  lockedInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    paddingRight: 40,
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // About Modal Styles
  aboutModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  aboutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  aboutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  aboutModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aboutModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  aboutLogoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  aboutLogo: {
    width: 80,
    height: 80,
  },
  aboutMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 20,
    textAlign: 'center',
  },
  aboutSubText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  aboutContactContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  aboutContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 12,
  },
  aboutContactEmail: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  aboutContactInstagram: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  feedbackCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
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
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  feedbackDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutTaglineContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 20,
    marginTop: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  aboutTagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Feedback Modal Styles
  feedbackModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EF4444',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackModalCloseText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedbackModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  feedbackFormContainer: {
    paddingVertical: 20,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  feedbackInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  feedbackTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackTypeOptionSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  feedbackTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  feedbackTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  feedbackTypeTextSelected: {
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 24,
  },
  starFilled: {
    color: '#FCD34D',
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  feedbackModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  feedbackCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  feedbackCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  feedbackSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  feedbackSubmitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  feedbackSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roleBadge: {
    backgroundColor: '#059669',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  lockedInputContainer: {
    position: 'relative',
  },
  lockedInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    paddingRight: 40,
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // About Modal Styles
  aboutModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  aboutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  aboutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  aboutModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aboutModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  aboutLogoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  aboutLogo: {
    width: 80,
    height: 80,
  },
  aboutMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 20,
    textAlign: 'center',
  },
  aboutSubText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  aboutContactContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  aboutContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 12,
  },
  aboutContactEmail: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  aboutContactInstagram: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  feedbackCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
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
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  feedbackDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutTaglineContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 20,
    marginTop: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  aboutTagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Feedback Modal Styles
  feedbackModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EF4444',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackModalCloseText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedbackModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  feedbackFormContainer: {
    paddingVertical: 20,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  feedbackInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  feedbackTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackTypeOptionSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  feedbackTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  feedbackTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  feedbackTypeTextSelected: {
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 24,
  },
  starFilled: {
    color: '#FCD34D',
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  feedbackModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  feedbackCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  feedbackCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  feedbackSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  feedbackSubmitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  feedbackSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Admin Profile Card Styles
  adminProfileCard: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FEF2F2',
  },
  adminCrownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  adminCrown: {
    marginRight: 8,
  },
  adminCrownText: {
    fontSize: 24,
  },
  adminHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  adminAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  adminProfileInfo: {
    alignItems: 'center',
  },
  adminProfileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  adminProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FEF2F2',
    marginBottom: 12,
    textAlign: 'center',
  },
  adminStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  adminStatusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  adminLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminInstitution: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  adminCity: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  adminPowersSection: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  adminPowersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  adminPowersList: {
    alignItems: 'flex-start',
  },
  adminPowerItem: {
    fontSize: 13,
    color: '#FEF2F2',
    marginBottom: 4,
    fontWeight: '500',
  },
  // Moderator Profile Card Styles
  moderatorProfileCard: {
    backgroundColor: '#059669',
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#ECFDF5',
  },
  moderatorShieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moderatorShield: {
    marginRight: 8,
  },
  moderatorHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  moderatorAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  moderatorProfileInfo: {
    alignItems: 'center',
  },
  moderatorProfileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  moderatorProfileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECFDF5',
    marginBottom: 10,
    textAlign: 'center',
  },
  moderatorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 14,
  },
  moderatorStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  moderatorLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  moderatorInstitution: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  moderatorCity: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  moderatorPowersSection: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  moderatorPowersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  moderatorPowersList: {
    alignItems: 'flex-start',
  },
  moderatorPowerItem: {
    fontSize: 11,
    color: '#ECFDF5',
    marginBottom: 3,
    fontWeight: '500',
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