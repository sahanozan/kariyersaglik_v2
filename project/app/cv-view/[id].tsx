import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Briefcase, GraduationCap, Award, Wrench, MapPin, Phone, Mail, Globe, Linkedin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface CV {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  phone: string;
  email: string;
  address: string;
  linkedin_url: string;
  website_url: string;
  is_public: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    branch: string;
    avatar_url: string | null;
  };
}

interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  gpa: string;
  description: string;
}

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
  credential_id: string;
  credential_url: string;
}

interface Skill {
  id: string;
  name: string;
  level: string;
  category: string;
}

export default function CVViewPage() {
  const { id } = useLocalSearchParams();
  const cvId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [cv, setCV] = useState<CV | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCVData();
    }
  }, [id]);

  const fetchCVData = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }

      // Fetch CV with user profile
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select(`
          *,
          profiles!cvs_user_id_fkey(first_name, last_name, branch, avatar_url)
        `)
        .eq('user_id', cvId)
        .maybeSingle();

      if (cvError) throw cvError;
      
      if (!cvData) {
        setLoading(false);
        return;
      }
      
      setCV(cvData as CV);

      // Fetch related data
      const [expRes, eduRes, certRes, skillRes] = await Promise.all([
        supabase.from('cv_experiences').select('*').eq('cv_id', cvData.id).order('start_date', { ascending: false }),
        supabase.from('cv_educations').select('*').eq('cv_id', cvData.id).order('start_date', { ascending: false }),
        supabase.from('cv_certifications').select('*').eq('cv_id', cvData.id).order('issue_date', { ascending: false }),
        supabase.from('cv_skills').select('*').eq('cv_id', cvData.id).order('category', { ascending: true })
      ]);

      setExperiences((expRes.data || []) as Experience[]);
      setEducations((eduRes.data || []) as Education[]);
      setCertifications((certRes.data || []) as Certification[]);
      setSkills((skillRes.data || []) as Skill[]);
    } catch (error) {
      console.error('Error fetching CV data:', error);
    } finally {
      setLoading(false);
    }
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

  const getSkillLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Başlangıç';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'İleri';
      case 'expert': return 'Uzman';
      default: return level;
    }
  };

  const getSkillCategoryText = (category: string) => {
    switch (category) {
      case 'technical': return 'Teknik';
      case 'soft': return 'Kişisel';
      case 'language': return 'Dil';
      default: return category;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CV Görüntüleniyor...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>CV yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cv) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CV Bulunamadı</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Bu kullanıcının CV'si bulunamadı.</Text>
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
        <Text style={styles.headerTitle}>CV / Özgeçmiş</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ 
              uri: cv.profiles.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
            }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {getFormattedName(cv.profiles.first_name, cv.profiles.last_name, cv.profiles.branch)}
            </Text>
            <Text style={styles.profileTitle}>{cv.title}</Text>
            <Text style={styles.profileBranch}>{cv.profiles.branch}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          <View style={styles.contactGrid}>
            {cv.phone && (
              <View style={styles.contactItem}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.contactText}>{cv.phone}</Text>
              </View>
            )}
            {cv.email && (
              <View style={styles.contactItem}>
                <Mail size={16} color="#6B7280" />
                <Text style={styles.contactText}>{cv.email}</Text>
              </View>
            )}
            {cv.address && (
              <View style={styles.contactItem}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.contactText}>{cv.address}</Text>
              </View>
            )}
            {cv.linkedin_url && (
              <View style={styles.contactItem}>
                <Linkedin size={16} color="#6B7280" />
                <Text style={styles.contactText}>LinkedIn</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary */}
        {cv.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Özet</Text>
            <Text style={styles.summaryText}>{cv.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>İş Deneyimi</Text>
            </View>
            {experiences.map((exp) => (
              <View key={exp.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{exp.position}</Text>
                <Text style={styles.itemSubtitle}>{exp.company}</Text>
                {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                <Text style={styles.itemDate}>
                  {new Date(exp.start_date).toLocaleDateString('tr-TR')} - {
                    exp.is_current ? 'Devam Ediyor' : 
                    exp.end_date ? new Date(exp.end_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'
                  }
                </Text>
                {exp.description && <Text style={styles.itemDescription}>{exp.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <GraduationCap size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Eğitim</Text>
            </View>
            {educations.map((edu) => (
              <View key={edu.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{edu.degree}</Text>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                {edu.field_of_study && <Text style={styles.itemLocation}>{edu.field_of_study}</Text>}
                <Text style={styles.itemDate}>
                  {new Date(edu.start_date).toLocaleDateString('tr-TR')} - {
                    edu.is_current ? 'Devam Ediyor' : 
                    edu.end_date ? new Date(edu.end_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'
                  }
                </Text>
                {edu.gpa && <Text style={styles.gpaText}>GPA: {edu.gpa}</Text>}
                {edu.description && <Text style={styles.itemDescription}>{edu.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Sertifikalar</Text>
            </View>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{cert.name}</Text>
                <Text style={styles.itemSubtitle}>{cert.issuing_organization}</Text>
                <Text style={styles.itemDate}>
                  Verilme: {new Date(cert.issue_date).toLocaleDateString('tr-TR')}
                  {cert.expiration_date && ` • Geçerlilik: ${new Date(cert.expiration_date).toLocaleDateString('tr-TR')}`}
                </Text>
                {cert.credential_id && <Text style={styles.credentialText}>ID: {cert.credential_id}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wrench size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Yetenekler</Text>
            </View>
            <View style={styles.skillsGrid}>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.skillCard}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillLevel}>{getSkillLevelText(skill.level)}</Text>
                  <Text style={styles.skillCategory}>{getSkillCategoryText(skill.category)}</Text>
                </View>
              ))}
            </View>
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
    backgroundColor: '#7C3AED',
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
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    flexDirection: 'row',
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  profileBranch: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  contactGrid: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  gpaText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  credentialText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 2,
  },
  skillCategory: {
    fontSize: 10,
    color: '#9CA3AF',
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