/*
  # CV/Özgeçmiş ve İş Başvuru Sistemi

  1. Yeni Tablolar
    - `cvs` - Kullanıcı CV/özgeçmiş bilgileri
    - `job_applications` - İş başvuruları
    - `cv_experiences` - İş deneyimleri
    - `cv_educations` - Eğitim bilgileri
    - `cv_certifications` - Sertifikalar
    - `cv_skills` - Yetenekler

  2. Güvenlik
    - Tüm tablolarda RLS etkin
    - CV bilgileri sadece arkadaşlar ve iş verenler tarafından görülebilir
    - İş başvuruları takip edilebilir

  3. İndeksler
    - Performans için gerekli indeksler eklendi
*/

-- CV ana tablosu
CREATE TABLE IF NOT EXISTS cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT '',
  summary text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  linkedin_url text DEFAULT '',
  website_url text DEFAULT '',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- İş deneyimleri
CREATE TABLE IF NOT EXISTS cv_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid REFERENCES cvs(id) ON DELETE CASCADE,
  position text NOT NULL,
  company text NOT NULL,
  location text DEFAULT '',
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Eğitim bilgileri
CREATE TABLE IF NOT EXISTS cv_educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid REFERENCES cvs(id) ON DELETE CASCADE,
  degree text NOT NULL,
  institution text NOT NULL,
  field_of_study text DEFAULT '',
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  gpa text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Sertifikalar
CREATE TABLE IF NOT EXISTS cv_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid REFERENCES cvs(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date NOT NULL,
  expiration_date date,
  credential_id text DEFAULT '',
  credential_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Yetenekler
CREATE TABLE IF NOT EXISTS cv_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid REFERENCES cvs(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
  category text DEFAULT 'technical', -- technical, soft, language
  created_at timestamptz DEFAULT now()
);

-- İş başvuruları
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- pending, reviewed, accepted, rejected
  cover_letter text DEFAULT '',
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  notes text DEFAULT '',
  UNIQUE(job_id, applicant_id)
);

-- RLS politikaları
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- CV politikaları
CREATE POLICY "Users can manage own CV"
  ON cvs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Friends can view CV"
  ON cvs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user1_id = auth.uid() AND f.user2_id = user_id)
         OR (f.user2_id = auth.uid() AND f.user1_id = user_id)
    ) OR
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_listings jl ON ja.job_id = jl.id
      WHERE ja.applicant_id = user_id AND jl.posted_by = auth.uid()
    )
  );

-- CV alt tablo politikaları
CREATE POLICY "Users can manage own CV experiences"
  ON cv_experiences
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()));

CREATE POLICY "CV experiences viewable by authorized users"
  ON cv_experiences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = cv_id AND (
        cvs.user_id = auth.uid() OR
        cvs.is_public = true OR
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user1_id = auth.uid() AND f.user2_id = cvs.user_id)
             OR (f.user2_id = auth.uid() AND f.user1_id = cvs.user_id)
        ) OR
        EXISTS (
          SELECT 1 FROM job_applications ja
          JOIN job_listings jl ON ja.job_id = jl.id
          WHERE ja.applicant_id = cvs.user_id AND jl.posted_by = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage own CV educations"
  ON cv_educations
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()));

CREATE POLICY "CV educations viewable by authorized users"
  ON cv_educations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = cv_id AND (
        cvs.user_id = auth.uid() OR
        cvs.is_public = true OR
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user1_id = auth.uid() AND f.user2_id = cvs.user_id)
             OR (f.user2_id = auth.uid() AND f.user1_id = cvs.user_id)
        ) OR
        EXISTS (
          SELECT 1 FROM job_applications ja
          JOIN job_listings jl ON ja.job_id = jl.id
          WHERE ja.applicant_id = cvs.user_id AND jl.posted_by = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage own CV certifications"
  ON cv_certifications
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()));

CREATE POLICY "CV certifications viewable by authorized users"
  ON cv_certifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = cv_id AND (
        cvs.user_id = auth.uid() OR
        cvs.is_public = true OR
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user1_id = auth.uid() AND f.user2_id = cvs.user_id)
             OR (f.user2_id = auth.uid() AND f.user1_id = cvs.user_id)
        ) OR
        EXISTS (
          SELECT 1 FROM job_applications ja
          JOIN job_listings jl ON ja.job_id = jl.id
          WHERE ja.applicant_id = cvs.user_id AND jl.posted_by = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage own CV skills"
  ON cv_skills
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cvs WHERE cvs.id = cv_id AND cvs.user_id = auth.uid()));

CREATE POLICY "CV skills viewable by authorized users"
  ON cv_skills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cvs 
      WHERE cvs.id = cv_id AND (
        cvs.user_id = auth.uid() OR
        cvs.is_public = true OR
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user1_id = auth.uid() AND f.user2_id = cvs.user_id)
             OR (f.user2_id = auth.uid() AND f.user1_id = cvs.user_id)
        ) OR
        EXISTS (
          SELECT 1 FROM job_applications ja
          JOIN job_listings jl ON ja.job_id = jl.id
          WHERE ja.applicant_id = cvs.user_id AND jl.posted_by = auth.uid()
        )
      )
    )
  );

-- İş başvuru politikaları
CREATE POLICY "Users can create job applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Users can view own applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Job posters can view applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = job_id AND jl.posted_by = auth.uid()
    )
  );

CREATE POLICY "Job posters can update applications"
  ON job_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = job_id AND jl.posted_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = job_id AND jl.posted_by = auth.uid()
    )
  );

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_experiences_cv_id ON cv_experiences(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_educations_cv_id ON cv_educations(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_certifications_cv_id ON cv_certifications(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_skills_cv_id ON cv_skills(cv_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_cv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_updated_at();