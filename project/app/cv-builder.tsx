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
  Modal,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Plus, Trash2, User, Briefcase, GraduationCap, Award, Wrench } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/utils';

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
}

interface Experience {
  id?: string;
  position: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

interface Education {
  id?: string;
  degree: string;
  institution: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  gpa: string;
  description: string;
}

interface Certification {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string;
  credential_id: string;
  credential_url: string;
}

interface Skill {
  id?: string;
  name: string;
  level: string;
  category: string;
}

export default function CVBuilderPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cv, setCV] = useState<CV>({
    id: '',
    user_id: user?.id || '',
    title: '',
    summary: '',
    phone: '',
    email: '',
    address: '',
    linkedin_url: '',
    website_url: '',
    is_public: false,
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [experienceForm, setExperienceForm] = useState<Experience>({
    position: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });

  const [educationForm, setEducationForm] = useState<Education>({
    degree: '',
    institution: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    gpa: '',
    description: '',
  });

  const [certificationForm, setCertificationForm] = useState<Certification>({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
  });

  const [skillForm, setSkillForm] = useState<Skill>({
    name: '',
    level: 'intermediate',
    category: 'technical',
  });

  useEffect(() => {
    if (user) {
      fetchCVData();
    }
  }, [user]);

  const fetchCVData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Fetch CV
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cvError && cvError.code !== 'PGRST116') throw cvError;

      if (cvData) {
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
      } else {
        // Initialize with user's email if no CV exists
        const { data: userData } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', user.id)
          .single();

        setCV(prev => ({
          ...prev,
          email: userData?.email || '',
          phone: userData?.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCV = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!cv.title && !cv.summary && !cv.phone && !cv.email) {
      Alert.alert('Hata', 'En az bir alan doldurulmalıdır');
      return;
    }

    setSaving(true);
    
    try {
      let cvId = cv.id;

      if (!cvId) {
        // Create new CV
        const { data: newCV, error: cvError } = await supabase
          .from('cvs')
          .insert({
            user_id: user.id,
            title: cv.title,
            summary: cv.summary,
            phone: cv.phone,
            email: cv.email,
            address: cv.address,
            linkedin_url: cv.linkedin_url,
            website_url: cv.website_url,
            is_public: cv.is_public,
          })
          .select()
          .single();

        if (cvError) throw cvError;
        cvId = newCV.id;
        setCV(prev => ({ ...prev, id: cvId }));
      } else {
        // Update existing CV
        const { error: cvError } = await supabase
          .from('cvs')
          .update({
            title: cv.title,
            summary: cv.summary,
            phone: cv.phone,
            email: cv.email,
            address: cv.address,
            linkedin_url: cv.linkedin_url,
            website_url: cv.website_url,
            is_public: cv.is_public,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cvId);

        if (cvError) throw cvError;
      }

      // Save experiences
      for (const exp of experiences) {
        if (!exp.position || !exp.company || !exp.start_date) continue;
        
        if (exp.id) {
          // Update existing
          const { error: expError } = await supabase
            .from('cv_experiences')
            .update({
              position: exp.position,
              company: exp.company,
              location: exp.location || '',
              start_date: exp.start_date,
              end_date: exp.is_current ? null : exp.end_date,
              is_current: exp.is_current,
              description: exp.description || '',
            })
            .eq('id', exp.id);
          
          if (expError) console.error('Error updating experience:', expError);
        } else {
          // Create new
          const { error: expError } = await supabase
            .from('cv_experiences')
            .insert({
              cv_id: cvId,
              position: exp.position,
              company: exp.company,
              location: exp.location || '',
              start_date: exp.start_date,
              end_date: exp.is_current ? null : exp.end_date,
              is_current: exp.is_current,
              description: exp.description || '',
            });
          
          if (expError) console.error('Error creating experience:', expError);
        }
      }

      // Save educations
      for (const edu of educations) {
        if (!edu.degree || !edu.institution || !edu.start_date) continue;
        
        if (edu.id) {
          // Update existing
          const { error: eduError } = await supabase
            .from('cv_educations')
            .update({
              degree: edu.degree,
              institution: edu.institution,
              field_of_study: edu.field_of_study || '',
              start_date: edu.start_date,
              end_date: edu.is_current ? null : edu.end_date,
              is_current: edu.is_current,
              gpa: edu.gpa || '',
              description: edu.description || '',
            })
            .eq('id', edu.id);
          
          if (eduError) console.error('Error updating education:', eduError);
        } else {
          // Create new
          const { error: eduError } = await supabase
            .from('cv_educations')
            .insert({
              cv_id: cvId,
              degree: edu.degree,
              institution: edu.institution,
              field_of_study: edu.field_of_study || '',
              start_date: edu.start_date,
              end_date: edu.is_current ? null : edu.end_date,
              is_current: edu.is_current,
              gpa: edu.gpa || '',
              description: edu.description || '',
            });
          
          if (eduError) console.error('Error creating education:', eduError);
        }
      }

      // Save certifications
      for (const cert of certifications) {
        if (!cert.name || !cert.issuing_organization || !cert.issue_date) continue;
        
        if (cert.id) {
          // Update existing
          const { error: certError } = await supabase
            .from('cv_certifications')
            .update({
              name: cert.name,
              issuing_organization: cert.issuing_organization,
              issue_date: cert.issue_date,
              expiration_date: cert.expiration_date || null,
              credential_id: cert.credential_id || '',
              credential_url: cert.credential_url || '',
            })
            .eq('id', cert.id);
          
          if (certError) console.error('Error updating certification:', certError);
        } else {
          // Create new
          const { error: certError } = await supabase
            .from('cv_certifications')
            .insert({
              cv_id: cvId,
              name: cert.name,
              issuing_organization: cert.issuing_organization,
              issue_date: cert.issue_date,
              expiration_date: cert.expiration_date || null,
              credential_id: cert.credential_id || '',
              credential_url: cert.credential_url || '',
            });
          
          if (certError) console.error('Error creating certification:', certError);
        }
      }

      // Save skills
      for (const skill of skills) {
        if (!skill.name) continue;
        
        if (skill.id) {
          // Update existing
          const { error: skillError } = await supabase
            .from('cv_skills')
            .update({
              name: skill.name,
              level: skill.level,
              category: skill.category,
            })
            .eq('id', skill.id);
          
          if (skillError) console.error('Error updating skill:', skillError);
        } else {
          // Create new
          const { error: skillError } = await supabase
            .from('cv_skills')
            .insert({
              cv_id: cvId,
              name: skill.name,
              level: skill.level,
              category: skill.category,
            });
          
          if (skillError) console.error('Error creating skill:', skillError);
        }
      }

      Alert.alert('Başarılı', 'CV bilgileriniz kaydedildi!');
    } catch (error) {
      console.error('Error saving CV:', error);
      Alert.alert('Hata', handleSupabaseError(error));
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => {
    setEditingExperience(null);
    setExperienceForm({
      position: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    });
    setShowExperienceModal(true);
  };

  const editExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setExperienceForm(experience);
    setShowExperienceModal(true);
  };

  const saveExperience = () => {
    if (!experienceForm.position || !experienceForm.company || !experienceForm.start_date) {
      Alert.alert('Hata', 'Pozisyon, şirket ve başlangıç tarihi zorunludur');
      return;
    }

    if (editingExperience) {
      setExperiences(prev => prev.map(exp => 
        exp.id === editingExperience.id ? { ...experienceForm, id: editingExperience.id } : exp
      ));
    } else {
      setExperiences(prev => [...prev, { ...experienceForm, id: Date.now().toString() }]);
    }

    setShowExperienceModal(false);
  };

  const deleteExperience = (experienceId: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== experienceId));
  };

  const addEducation = () => {
    setEditingEducation(null);
    setEducationForm({
      degree: '',
      institution: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false,
      gpa: '',
      description: '',
    });
    setShowEducationModal(true);
  };

  const editEducation = (education: Education) => {
    setEditingEducation(education);
    setEducationForm(education);
    setShowEducationModal(true);
  };

  const saveEducation = () => {
    if (!educationForm.degree || !educationForm.institution || !educationForm.start_date) {
      Alert.alert('Hata', 'Derece, kurum ve başlangıç tarihi zorunludur');
      return;
    }

    if (editingEducation) {
      setEducations(prev => prev.map(edu => 
        edu.id === editingEducation.id ? { ...educationForm, id: editingEducation.id } : edu
      ));
    } else {
      setEducations(prev => [...prev, { ...educationForm, id: Date.now().toString() }]);
    }

    setShowEducationModal(false);
  };

  const deleteEducation = (educationId: string) => {
    setEducations(prev => prev.filter(edu => edu.id !== educationId));
  };

  const addCertification = () => {
    setEditingCertification(null);
    setCertificationForm({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiration_date: '',
      credential_id: '',
      credential_url: '',
    });
    setShowCertificationModal(true);
  };

  const editCertification = (certification: Certification) => {
    setEditingCertification(certification);
    setCertificationForm(certification);
    setShowCertificationModal(true);
  };

  const saveCertification = () => {
    if (!certificationForm.name || !certificationForm.issuing_organization || !certificationForm.issue_date) {
      Alert.alert('Hata', 'Sertifika adı, veren kurum ve veriliş tarihi zorunludur');
      return;
    }

    if (editingCertification) {
      setCertifications(prev => prev.map(cert => 
        cert.id === editingCertification.id ? { ...certificationForm, id: editingCertification.id } : cert
      ));
    } else {
      setCertifications(prev => [...prev, { ...certificationForm, id: Date.now().toString() }]);
    }

    setShowCertificationModal(false);
  };

  const deleteCertification = (certificationId: string) => {
    setCertifications(prev => prev.filter(cert => cert.id !== certificationId));
  };

  const addSkill = () => {
    setEditingSkill(null);
    setSkillForm({
      name: '',
      level: 'intermediate',
      category: 'technical',
    });
    setShowSkillModal(true);
  };

  const editSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm(skill);
    setShowSkillModal(true);
  };

  const saveSkill = () => {
    if (!skillForm.name) {
      Alert.alert('Hata', 'Yetenek adı zorunludur');
      return;
    }

    if (editingSkill) {
      setSkills(prev => prev.map(skill => 
        skill.id === editingSkill.id ? { ...skillForm, id: editingSkill.id } : skill
      ));
    } else {
      setSkills(prev => [...prev, { ...skillForm, id: Date.now().toString() }]);
    }

    setShowSkillModal(false);
  };

  const deleteSkill = (skillId: string) => {
    setSkills(prev => prev.filter(skill => skill.id !== skillId));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CV Yükleniyor...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>CV bilgileri yükleniyor...</Text>
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
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveCV}
          disabled={saving}
        >
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Başlık</Text>
            <TextInput
              style={styles.input}
              value={cv.title}
              onChangeText={(text) => setCV(prev => ({ ...prev, title: text }))}
              placeholder="Örn: Senior Hemşire"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Özet</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={cv.summary}
              onChangeText={(text) => setCV(prev => ({ ...prev, summary: text }))}
              placeholder="Kendinizi kısaca tanıtın..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={cv.phone}
              onChangeText={(text) => setCV(prev => ({ ...prev, phone: text }))}
              placeholder="Telefon numaranız"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={cv.email}
              onChangeText={(text) => setCV(prev => ({ ...prev, email: text }))}
              placeholder="E-posta adresiniz"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Adres</Text>
            <TextInput
              style={styles.input}
              value={cv.address}
              onChangeText={(text) => setCV(prev => ({ ...prev, address: text }))}
              placeholder="Adresiniz"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>LinkedIn URL</Text>
            <TextInput
              style={styles.input}
              value={cv.linkedin_url}
              onChangeText={(text) => setCV(prev => ({ ...prev, linkedin_url: text }))}
              placeholder="LinkedIn profil linkiniz"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Website URL</Text>
            <TextInput
              style={styles.input}
              value={cv.website_url}
              onChangeText={(text) => setCV(prev => ({ ...prev, website_url: text }))}
              placeholder="Kişisel website linkiniz"
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>CV'mi herkese açık yap</Text>
            <Switch
              value={cv.is_public}
              onValueChange={(value) => setCV(prev => ({ ...prev, is_public: value }))}
              trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
              thumbColor={cv.is_public ? '#7C3AED' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>İş Deneyimi</Text>
            <TouchableOpacity style={styles.addButton} onPress={addExperience}>
              <Plus size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          
          {experiences.map((exp, index) => (
            <View key={exp.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{exp.position}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => editExperience(exp)}>
                    <Text style={styles.editText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteExperience(exp.id!)}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>{exp.company}</Text>
              <Text style={styles.itemDate}>
                {exp.start_date} - {exp.is_current ? 'Devam Ediyor' : exp.end_date}
              </Text>
            </View>
          ))}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Eğitim</Text>
            <TouchableOpacity style={styles.addButton} onPress={addEducation}>
              <Plus size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          
          {educations.map((edu, index) => (
            <View key={edu.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{edu.degree}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => editEducation(edu)}>
                    <Text style={styles.editText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEducation(edu.id!)}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>{edu.institution}</Text>
              <Text style={styles.itemDate}>
                {edu.start_date} - {edu.is_current ? 'Devam Ediyor' : edu.end_date}
              </Text>
            </View>
          ))}
        </View>

        {/* Certifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Sertifikalar</Text>
            <TouchableOpacity style={styles.addButton} onPress={addCertification}>
              <Plus size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          
          {certifications.map((cert, index) => (
            <View key={cert.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{cert.name}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => editCertification(cert)}>
                    <Text style={styles.editText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCertification(cert.id!)}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>{cert.issuing_organization}</Text>
              <Text style={styles.itemDate}>{cert.issue_date}</Text>
            </View>
          ))}
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Yetenekler</Text>
            <TouchableOpacity style={styles.addButton} onPress={addSkill}>
              <Plus size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.skillsGrid}>
            {skills.map((skill, index) => (
              <View key={skill.id || index} style={styles.skillCard}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillLevel}>{skill.level}</Text>
                <View style={styles.skillActions}>
                  <TouchableOpacity onPress={() => editSkill(skill)}>
                    <Text style={styles.editText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSkill(skill.id!)}>
                    <Trash2 size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Experience Modal */}
      <Modal visible={showExperienceModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingExperience ? 'Deneyimi Düzenle' : 'Deneyim Ekle'}
            </Text>
            <TouchableOpacity onPress={() => setShowExperienceModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pozisyon *</Text>
              <TextInput
                style={styles.modalInput}
                value={experienceForm.position}
                onChangeText={(text) => setExperienceForm(prev => ({ ...prev, position: text }))}
                placeholder="Örn: Senior Hemşire"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şirket/Kurum *</Text>
              <TextInput
                style={styles.modalInput}
                value={experienceForm.company}
                onChangeText={(text) => setExperienceForm(prev => ({ ...prev, company: text }))}
                placeholder="Örn: Ankara Şehir Hastanesi"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Konum</Text>
              <TextInput
                style={styles.modalInput}
                value={experienceForm.location}
                onChangeText={(text) => setExperienceForm(prev => ({ ...prev, location: text }))}
                placeholder="Örn: Ankara, Türkiye"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Başlangıç Tarihi *</Text>
              <TextInput
                style={styles.modalInput}
                value={experienceForm.start_date}
                onChangeText={(text) => setExperienceForm(prev => ({ ...prev, start_date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Halen çalışıyorum</Text>
              <Switch
                value={experienceForm.is_current}
                onValueChange={(value) => setExperienceForm(prev => ({ ...prev, is_current: value }))}
                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                thumbColor={experienceForm.is_current ? '#7C3AED' : '#9CA3AF'}
              />
            </View>

            {!experienceForm.is_current && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bitiş Tarihi</Text>
                <TextInput
                  style={styles.modalInput}
                  value={experienceForm.end_date}
                  onChangeText={(text) => setExperienceForm(prev => ({ ...prev, end_date: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={experienceForm.description}
                onChangeText={(text) => setExperienceForm(prev => ({ ...prev, description: text }))}
                placeholder="İş tanımınızı yazın..."
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.modalSaveButton} onPress={saveExperience}>
              <Text style={styles.modalSaveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Education Modal */}
      <Modal visible={showEducationModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingEducation ? 'Eğitimi Düzenle' : 'Eğitim Ekle'}
            </Text>
            <TouchableOpacity onPress={() => setShowEducationModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Derece *</Text>
              <TextInput
                style={styles.modalInput}
                value={educationForm.degree}
                onChangeText={(text) => setEducationForm(prev => ({ ...prev, degree: text }))}
                placeholder="Örn: Lisans"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kurum *</Text>
              <TextInput
                style={styles.modalInput}
                value={educationForm.institution}
                onChangeText={(text) => setEducationForm(prev => ({ ...prev, institution: text }))}
                placeholder="Örn: Hacettepe Üniversitesi"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bölüm</Text>
              <TextInput
                style={styles.modalInput}
                value={educationForm.field_of_study}
                onChangeText={(text) => setEducationForm(prev => ({ ...prev, field_of_study: text }))}
                placeholder="Örn: Hemşirelik"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Başlangıç Tarihi *</Text>
              <TextInput
                style={styles.modalInput}
                value={educationForm.start_date}
                onChangeText={(text) => setEducationForm(prev => ({ ...prev, start_date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Halen devam ediyor</Text>
              <Switch
                value={educationForm.is_current}
                onValueChange={(value) => setEducationForm(prev => ({ ...prev, is_current: value }))}
                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                thumbColor={educationForm.is_current ? '#7C3AED' : '#9CA3AF'}
              />
            </View>

            {!educationForm.is_current && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bitiş Tarihi</Text>
                <TextInput
                  style={styles.modalInput}
                  value={educationForm.end_date}
                  onChangeText={(text) => setEducationForm(prev => ({ ...prev, end_date: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>GPA</Text>
              <TextInput
                style={styles.modalInput}
                value={educationForm.gpa}
                onChangeText={(text) => setEducationForm(prev => ({ ...prev, gpa: text }))}
                placeholder="Örn: 3.5/4.0"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={educationForm.description}
                onChangeText={(text) => setEducationForm(prev => ({ ...prev, description: text }))}
                placeholder="Eğitim hakkında ek bilgiler..."
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.modalSaveButton} onPress={saveEducation}>
              <Text style={styles.modalSaveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Certification Modal */}
      <Modal visible={showCertificationModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCertification ? 'Sertifikayı Düzenle' : 'Sertifika Ekle'}
            </Text>
            <TouchableOpacity onPress={() => setShowCertificationModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sertifika Adı *</Text>
              <TextInput
                style={styles.modalInput}
                value={certificationForm.name}
                onChangeText={(text) => setCertificationForm(prev => ({ ...prev, name: text }))}
                placeholder="Örn: BLS Sertifikası"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Veren Kurum *</Text>
              <TextInput
                style={styles.modalInput}
                value={certificationForm.issuing_organization}
                onChangeText={(text) => setCertificationForm(prev => ({ ...prev, issuing_organization: text }))}
                placeholder="Örn: Türk Kalp Vakfı"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Veriliş Tarihi *</Text>
              <TextInput
                style={styles.modalInput}
                value={certificationForm.issue_date}
                onChangeText={(text) => setCertificationForm(prev => ({ ...prev, issue_date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Geçerlilik Tarihi</Text>
              <TextInput
                style={styles.modalInput}
                value={certificationForm.expiration_date}
                onChangeText={(text) => setCertificationForm(prev => ({ ...prev, expiration_date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sertifika ID</Text>
              <TextInput
                style={styles.modalInput}
                value={certificationForm.credential_id}
                onChangeText={(text) => setCertificationForm(prev => ({ ...prev, credential_id: text }))}
                placeholder="Sertifika numarası"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sertifika URL</Text>
              <TextInput
                style={styles.modalInput}
                value={certificationForm.credential_url}
                onChangeText={(text) => setCertificationForm(prev => ({ ...prev, credential_url: text }))}
                placeholder="Doğrulama linki"
              />
            </View>

            <TouchableOpacity style={styles.modalSaveButton} onPress={saveCertification}>
              <Text style={styles.modalSaveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Skill Modal */}
      <Modal visible={showSkillModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingSkill ? 'Yeteneği Düzenle' : 'Yetenek Ekle'}
            </Text>
            <TouchableOpacity onPress={() => setShowSkillModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yetenek Adı *</Text>
              <TextInput
                style={styles.modalInput}
                value={skillForm.name}
                onChangeText={(text) => setSkillForm(prev => ({ ...prev, name: text }))}
                placeholder="Örn: CPR"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Seviye</Text>
              <View style={styles.levelButtons}>
                {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      skillForm.level === level && styles.activeLevelButton
                    ]}
                    onPress={() => setSkillForm(prev => ({ ...prev, level }))}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      skillForm.level === level && styles.activeLevelButtonText
                    ]}>
                      {level === 'beginner' ? 'Başlangıç' :
                       level === 'intermediate' ? 'Orta' :
                       level === 'advanced' ? 'İleri' : 'Uzman'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kategori</Text>
              <View style={styles.categoryButtons}>
                {['technical', 'soft', 'language'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      skillForm.category === category && styles.activeCategoryButton
                    ]}
                    onPress={() => setSkillForm(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      skillForm.category === category && styles.activeCategoryButtonText
                    ]}>
                      {category === 'technical' ? 'Teknik' :
                       category === 'soft' ? 'Kişisel' : 'Dil'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.modalSaveButton} onPress={saveSkill}>
              <Text style={styles.modalSaveButtonText}>Kaydet</Text>
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
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
    flex: 1,
  },
  addButton: {
    padding: 8,
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
  input: {
    backgroundColor: '#F9FAFB',
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    marginBottom: 8,
  },
  skillActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
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
  modalSaveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  levelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeLevelButton: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  levelButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeLevelButtonText: {
    color: '#FFFFFF',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    alignItems: 'center',
  },
  activeCategoryButton: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeCategoryButtonText: {
    color: '#FFFFFF',
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