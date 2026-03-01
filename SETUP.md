# Guide de configuration — Mashrabuç Çâfî 2026

## Vue d'ensemble

Ce projet est un site Next.js avec :
- **Frontend** : pages publiques (accueil + jours)
- **Backend** : API routes Next.js
- **Base de données** : Supabase (PostgreSQL)
- **Stockage audio** : Cloudinary
- **Hébergement** : Vercel
- **Admin** : `/admin` protégé par mot de passe

---

## Étape 1 — Supabase

### 1.1 Créer un compte
→ https://app.supabase.com → Sign Up → New Project

### 1.2 Créer les tables SQL
Dans Supabase → SQL Editor → colle et exécute ce SQL :

\`\`\`sql
-- Table des jours
CREATE TABLE jours (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 30),
  titre TEXT NOT NULL DEFAULT '',
  titre_ar TEXT,
  date_programme DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des sons
CREATE TABLE sons (
  id SERIAL PRIMARY KEY,
  jour_id INTEGER NOT NULL REFERENCES jours(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Audio',
  duree TEXT NOT NULL DEFAULT '--:--',
  url TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_sons_jour_id ON sons(jour_id);
CREATE INDEX idx_sons_ordre ON sons(jour_id, ordre);

-- Activer RLS (Row Level Security)
ALTER TABLE jours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sons ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Lecture publique jours" ON jours FOR SELECT USING (true);
CREATE POLICY "Lecture publique sons" ON sons FOR SELECT USING (true);
\`\`\`

### 1.3 Insérer les 30 jours
Remplace les titres et dates selon ton programme :

\`\`\`sql
INSERT INTO jours (numero, titre, titre_ar, date_programme) VALUES
(1,  'Kourel Mashrabuç Çâfî',           'الكورال مشرب صافي',     '2026-02-19'),
(2,  'Kourel Nurud Darayni Touba',       '',                        '2026-02-20'),
(3,  'Kourel Mafatihul Bichri Touba',    '',                        '2026-02-21'),
(4,  'Kourel Nurud Darayni Parcelles',   '',                        '2026-02-22'),
(5,  'Kourel Serigne Mahib Gueye',       '',                        '2026-02-23'),
(6,  'Kourel Nurud Darayni Thies',       '',                        '2026-02-24'),
(7,  'Kourel Nurud Darayni Keur Massar', '',                        '2026-02-25'),
(8,  'Kourel Serigne Saliou Mbacke',     '',                        '2026-02-26'),
(9,  'Kourel Nurud Darayni Dakar',       '',                        '2026-02-27'),
(10, 'Kourel Serigne Massamba Mbacke',   '',                        '2026-02-28'),
(11, 'Kourel Jour 11',                   '',                        '2026-03-01'),
(12, 'Kourel Jour 12',                   '',                        '2026-03-02'),
(13, 'Kourel Jour 13',                   '',                        '2026-03-03'),
(14, 'Kourel Jour 14',                   '',                        '2026-03-04'),
(15, 'Kourel Jour 15',                   '',                        '2026-03-05'),
(16, 'Kourel Jour 16',                   '',                        '2026-03-06'),
(17, 'Kourel Jour 17',                   '',                        '2026-03-07'),
(18, 'Kourel Jour 18',                   '',                        '2026-03-08'),
(19, 'Kourel Jour 19',                   '',                        '2026-03-09'),
(20, 'Kourel Jour 20',                   '',                        '2026-03-10'),
(21, 'Kourel Jour 21',                   '',                        '2026-03-11'),
(22, 'Kourel Jour 22',                   '',                        '2026-03-12'),
(23, 'Kourel Jour 23',                   '',                        '2026-03-13'),
(24, 'Kourel Jour 24',                   '',                        '2026-03-14'),
(25, 'Kourel Jour 25',                   '',                        '2026-03-15'),
(26, 'Kourel Jour 26',                   '',                        '2026-03-16'),
(27, 'Kourel Jour 27',                   '',                        '2026-03-17'),
(28, 'Kourel Jour 28',                   '',                        '2026-03-18'),
(29, 'Kourel Jour 29',                   '',                        '2026-03-19'),
(30, 'Kourel Jour 30',                   '',                        '2026-03-20');
\`\`\`

### 1.4 Récupérer les clés
→ Supabase → Settings → API
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ ne jamais exposer côté client

---

## Étape 2 — Cloudinary

### 2.1 Créer un compte
→ https://cloudinary.com → Sign Up gratuit (25GB)

### 2.2 Récupérer les clés
→ Cloudinary Dashboard (page d'accueil)
- **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
- **API Key** → `CLOUDINARY_API_KEY`
- **API Secret** → `CLOUDINARY_API_SECRET`

---

## Étape 3 — Variables d'environnement

### En local
\`\`\`bash
cp .env.local.example .env.local
# Remplis les valeurs dans .env.local
\`\`\`

### Sur Vercel
→ Vercel → ton projet → Settings → Environment Variables
Ajoute toutes les variables de `.env.local.example` avec leurs vraies valeurs.

---

## Étape 4 — Installation et lancement local

\`\`\`bash
npm install
npm run dev
\`\`\`
→ Site sur http://localhost:3000
→ Admin sur http://localhost:3000/admin

---

## Étape 5 — Déploiement sur Vercel

\`\`\`bash
# Si pas encore connecté
npm i -g vercel
vercel login

# Deploy
vercel --prod
\`\`\`

Ou simplement push sur GitHub et Vercel redéploie automatiquement.

---

## Utilisation de l'admin

1. Va sur `ton-site.vercel.app/admin`
2. Entre le mot de passe défini dans `ADMIN_PASSWORD`
3. Sélectionne un jour dans la sidebar
4. Clique "Ajouter un son"
5. Remplis le nom, le type, et upload le fichier MP3
6. Le son est automatiquement uploadé sur Cloudinary et ajouté au jour

---

## Structure des fichiers

\`\`\`
app/
  page.tsx              → Accueil (liste des 30 jours)
  jour/[id]/
    page.tsx            → Page d'un jour (server component)
    AudioList.tsx       → Player audio (client component)
  admin/
    page.tsx            → Login admin
    dashboard/
      page.tsx          → Dashboard (server)
      AdminDashboardClient.tsx → UI admin (client)
  api/
    auth/login/         → POST connexion
    auth/logout/        → POST déconnexion
    jours/              → GET liste des jours
    jours/[id]/         → GET sons d'un jour + PATCH titre
    sons/[id]/          → DELETE un son
    upload/             → POST upload audio
lib/
  supabase.ts           → Client Supabase
  cloudinary.ts         → Client Cloudinary + uploadAudio
  auth.ts               → JWT helpers
middleware.ts           → Protection routes /admin/*
\`\`\`

---

## Images

Copie tes images dans le dossier `public/` :
- `public/mosque.png` → image de la mosquée de Touba
- `public/bamba.png` → image de Serigne Touba
