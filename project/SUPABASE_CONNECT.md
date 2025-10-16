Supabase bağlantısı — hızlı rehber

Aşağıdaki adımlar, yerel projenizi Supabase projenize bağlamak ve SQL migration/uzantıları çalıştırmak için kullanılacaktır.

1) Supabase CLI ve VS Code uzantısını kurun
- Supabase CLI kurulum (Windows PowerShell için):
  - Scoop varsa: scoop install supabase
  - Winget varsa: winget install supabase
  - Manuel: https://supabase.com/docs/guides/cli

- VS Code Supabase extension yükleyin: Marketplace'ten "Supabase" adlı uzantıyı kurun.

2) CLI ile giriş yapın
- Terminal (PowerShell) içinde:

```powershell
supabase login
```

3) Projeyi bağlayın (proje id ile)
- Supabase web konsolundan projenizin `Project ref` (ör. c3093a8d-...) değerini alın.

```powershell
cd project
supabase link --project-ref <YOUR_PROJECT_REF>
```

4) Yerel veritabanını başlat (opsiyonel - geliştirme için)

```powershell
supabase start
```

5) SQL migration çalıştırma

```powershell
supabase db push
# veya tek seferlik SQL çalıştırma için:
supabase sql "\path\to\file.sql"
```

6) VS Code ile entegrasyon
- Supabase uzantısında oturum açın (Açılır pencere -> supabase token veya `supabase login` kullanın)
- Uzantı panelinde projenizi seçin ve SQL Editor/policies/migrations'ı kullanın.

Notlar
- Supabase CLI, Docker gerektirir (local DB başlatacaksanız)
- Production değişikliklerini doğrudan web konsolda da yapabilirsiniz; migration yönetmek için `supabase migration` veya `supabase db push` tercih edilir.

Güvenlik: Supabase anahtarlarını .env içinde saklayın ve public repo'ya itmeyin.
