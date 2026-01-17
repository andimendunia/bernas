# 🌾 Bernas

**Platform Manajemen Acara & Partisipasi untuk LSM Indonesia**

Bernas adalah platform SaaS modern yang dirancang untuk membantu Lembaga Swadaya Masyarakat (LSM) di Indonesia mengelola acara, melacak intensi partisipasi, mengorganisir sumber daya, dan mencocokkan keterampilan dengan peluang.

## ✨ Fitur

- **📅 Manajemen Acara** - Buat, organisir, dan kelola acara dengan tag dan pelacakan partisipasi
- **✅ Manajemen Tugas** - Pecah acara menjadi tugas-tugas actionable dengan persyaratan keterampilan
- **👥 Intensi Partisipasi** - Lacak siapa yang tertarik, konfirmasi, atau tidak tersedia untuk acara
- **📚 Perpustakaan Sumber Daya** - Penyimpanan terpusat untuk dokumen, tautan, dan sumber daya bersama dengan tagging
- **🎯 Sistem Keterampilan** - Cocokkan keterampilan anggota dengan kebutuhan acara dan tugas
- **🏷️ Sistem Tag** - Kategorikan acara dan sumber daya dengan tag berwarna yang dapat dikustomisasi
- **👤 Manajemen Anggota** - Kontrol akses berbasis peran dengan izin granular
- **🔐 Onboarding Organisasi** - Alur bergabung yang efisien dengan persetujuan admin
- **🌐 Dukungan Multi-Organisasi** - Beralih antar organisasi dengan mudah

## 🛠️ Teknologi

### Inti
- **Framework**: Next.js 16 (App Router) + React 19
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS 4
- **Komponen UI**: shadcn/ui (Radix UI primitives)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Autentikasi**: Supabase Auth (OAuth + Magic Links)
- **Storage**: Supabase Storage
- **RLS**: Row Level Security untuk proteksi data

### Library Utama
- `@tanstack/react-table` - Tabel data advanced dengan sorting/filtering
- `sonner` - Notifikasi toast
- `next-intl` - Internasionalisasi (i18n ready)
- `lucide-react` - Library ikon
- `next-themes` - Manajemen tema

## 🚀 Memulai

### Prasyarat
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase CLI (untuk pengembangan lokal)

### Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/bernas.git
   cd bernas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Konfigurasi environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan Supabase lokal** (opsional)
   ```bash
   npx supabase@latest start
   ```
   
   Akses Supabase Studio di http://127.0.0.1:54323

5. **Jalankan development server**
   ```bash
   npm run dev
   ```
   
   Buka http://localhost:3000 untuk melihat aplikasi

## 📁 Struktur Proyek

```
bernas/
├── src/
│   ├── app/                    # Halaman Next.js App Router
│   │   ├── dashboard/          # Rute aplikasi utama
│   │   ├── auth/               # Alur autentikasi
│   │   └── onboarding/         # Onboarding organisasi
│   ├── components/             # Komponen React
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── administration/     # Komponen panel admin
│   │   ├── members/            # Manajemen anggota
│   │   ├── organization/       # Komponen organisasi
│   │   ├── resources/          # Perpustakaan sumber daya
│   │   ├── skills/             # Manajemen keterampilan
│   │   └── tags/               # Manajemen tag
│   └── lib/                    # Utilities dan helpers
│       ├── supabase/           # Klien Supabase
│       └── permissions.ts      # Helper izin
├── supabase/
│   └── migrations/             # Migrasi database
├── AGENTS.md                   # Dokumentasi teknis
├── FEATURES.md                 # Spesifikasi produk
└── PATTERNS.md                 # Pola kode & best practices
```

## 🗄️ Skema Database

### Tabel Inti
- `organizations` - Data organisasi dengan kode join dan avatar
- `org_members` - Record keanggotaan dengan penugasan role
- `roles` - Role khusus per organisasi
- `permissions` - Izin sistem (predefined)
- `role_permissions` - Pemetaan role-permission
- `join_requests` - Alur permintaan bergabung organisasi

### Manajemen Acara
- `events` - Data acara
- `tasks` - Tugas yang terkait dengan acara
- `participation` - Intensi partisipasi anggota
- `event_tags` - Tag UPPERCASE untuk kategorisasi
- `event_tag_links` - Relasi acara-tag
- `event_skill_links` - Keterampilan yang dibutuhkan untuk acara

### Sumber Daya & Keterampilan
- `resources` - Perpustakaan sumber daya dengan URL/file
- `resource_tag_links` - Relasi sumber daya-tag
- `skills` - Keterampilan lowercase (terpisah dari tag)
- `member_skills` - Penugasan keterampilan anggota
- `task_skill_links` - Keterampilan yang dibutuhkan untuk tugas

## 🔐 Autentikasi & Izin

### Alur Autentikasi
- **Sign-in**: `/auth/sign-in` (Google OAuth di produksi, magic link di lokal)
- **Callback**: `/auth/callback`
- **Sign-out**: `/auth/sign-out`

### Sistem Izin
- Kontrol akses berbasis peran (RBAC)
- Izin granular (mis., `members.remove`, `events.create`)
- Admin bypass (admin memiliki semua izin)
- Kebijakan RLS menerapkan izin di tingkat database

## 🌱 Pengembangan Lokal

### Perintah Supabase Lokal
```bash
# Jalankan Supabase lokal
npx supabase@latest start

# Hentikan Supabase lokal
npx supabase@latest stop

# Reset database (terapkan migrasi)
npx supabase@latest db reset
```

### Layanan Lokal
- **App**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323
- **Mailpit** (email lokal): http://127.0.0.1:54324

## 📚 Dokumentasi

- **[AGENTS.md](./AGENTS.md)** - Stack teknis, arsitektur, dan pola pengembangan
- **[FEATURES.md](./FEATURES.md)** - Spesifikasi fitur dan roadmap produk
- **[PATTERNS.md](./PATTERNS.md)** - Pola kode, best practices, dan konvensi

## 🎨 Filosofi Desain

- **Open Design** - Border minimal, layout lapang
- **Mobile-First** - Desain responsif dengan breakpoint Tailwind
- **Accessible** - Dibangun di atas Radix UI primitives
- **Konsisten** - Sistem desain berbasis shadcn/ui

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan baca file dokumentasi untuk pola kode dan konvensi sebelum mengirim PR.

## 📄 Lisensi

[MIT License](LICENSE)

## 🙏 Penghargaan

Dibangun dengan ❤️ untuk komunitas LSM di Indonesia.

---

**Dibuat dengan Next.js, Supabase, dan Tailwind CSS**
