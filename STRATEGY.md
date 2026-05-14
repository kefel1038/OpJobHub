# KeFeL Job Hub — Strategic Architecture & Implementation Guide

## 1. PLATFORM OVERVIEW

### Vision
Transform KeFeL from a passive job listing platform into **Africa's AI-Powered Employment Operating System** — an intelligent recruitment infrastructure that automates sourcing, matching, engagement, deployment, and workforce intelligence across Africa and the Middle East.

### Core Offering
```
OpJobHub = AI Recruitment Operating System
         = Multi-Agent Sourcing + Intelligent Matching + Automated Syndication
         + Recruiter CRM + Browser Extension + MCP AI Infrastructure
         + Labor Market Intelligence + End-to-End Deployment
```

### Target Personas
| Persona | Need | Solution |
|---------|------|----------|
| Gulf Employer | Fast, verified workforce | AI matching + bulk hiring + visa support |
| Recruitment Agency | White-label platform | Agency dashboard + candidate pool + deployment tools |
| African Job Seeker | Gulf job access | Verified profile + video intro + direct employer chat |
| Freelancer/Gig Worker | Project work | Gig marketplace + escrow + instant contracts |
| Staffing Company | Temp workforce | Contract management + compliance + payroll |

---

## 2. INTEGRATED STRATEGIC ARCHITECTURE

### Positioning
Do NOT market OpJobHub as a job board, recruitment portal, or employment listing site.
Position it as:

> **"Africa's AI-Powered Employment Operating System"**
> — The AI Recruitment Infrastructure for Africa & the Middle East.

### 2.1 Recruitment Browser Extension (Highest Strategic ROI)

Inspired by AiToEarn's engagement automation. A Plasmo-based browser extension that makes OpJobHub omnipresent in recruiters' daily workflow.

#### Recruiter Features
- One-click import from LinkedIn, Indeed, Bayt
- Auto-extract: skills, experience, certifications, education
- AI candidate scoring while browsing profiles
- AI fit analysis (match against open roles in pipeline)
- Save candidate directly into pipeline with one click

#### Job Seeker Features
- Apply instantly to jobs from any page
- AI resume tailoring for specific applications
- Salary estimation based on market data
- Sponsorship probability scoring
- ATS optimization feedback

#### Employer Features
- Auto-post jobs to LinkedIn, X/Twitter, Facebook, WhatsApp, Telegram
- AI-generated hashtags, captions, localized copy, poster graphics
- Syndication analytics (which channels drive applications)

### 2.2 MCP Protocol Integration (Extremely Forward-Thinking)

Expose an MCP (Model Context Protocol) server making OpJobHub **AI-native infrastructure**. Claude, Cursor, VS Code AI agents, ChatGPT tools, and autonomous agents can interact with the platform programmatically.

#### Use Cases
- **Recruiter**: *"Find top 20 telecom engineers in Qatar with 5+ years experience"*
- **Job Seeker**: *"Find sponsorship jobs in Doha matching my CV"*
- **Employer**: *"Summarize hiring bottlenecks this month"*
- **Analyst**: *"What are the top 10 in-demand skills in Saudi Arabia right now?"*

This transforms OpJobHub into **conversational recruitment infrastructure** — very few job platforms are thinking this way yet.

### 2.3 AI Multi-Agent Recruitment System

The core architecture. Specialized AI agents working in concert:

| Agent | Function |
|-------|----------|
| **Sourcing Agent** | Finds candidates across platforms (job boards, social, forums) |
| **Matching Agent** | Scores compatibility using semantic embeddings + weighted criteria |
| **Outreach Agent** | Sends personalized follow-ups, nurtures passive candidates |
| **Resume Agent** | Optimizes CVs, ATS scoring, skill gap analysis, cover letters |
| **Job Description Agent** | Generates professional, inclusive, optimized JDs |
| **Syndication Agent** | Cross-posts jobs to 10+ platforms with platform-specific formatting |
| **Analytics Agent** | Generates workforce insights, salary trends, hiring heatmaps |
| **Interview Agent** | Schedules interviews, generates role-specific questions |
| **Compliance Agent** | Validates labor law compliance across GCC countries |
| **Verification Agent** | Detects fake employers, fraudulent job posts, scam patterns |

### 2.4 Social Recruitment Distribution Engine

Critical for African markets where WhatsApp, Telegram, and Facebook groups dominate.

#### Workflow
```
Employer posts job
        ↓
AI reformats per platform (LinkedIn, X, Facebook, WhatsApp, Telegram)
        ↓
AI generates: hashtags, captions, localized wording, poster graphics
        ↓
Auto-publishes to connected channels
        ↓
Tracks click-through, applications, engagement per channel
```

### 2.5 Recruitment Engagement Mining

Inspired by AiToEarn's comment mining. Detect job-seeking intent signals from public platforms:

- "looking for work in Qatar"
- "need sponsorship"
- "telecom engineer available"
- "open to relocation"

Sources: X/Twitter, LinkedIn, Telegram groups, Facebook groups, Reddit, public forums.

Then: recommend matching jobs, invite candidates, auto-nurture leads. This becomes **recruitment lead generation** at scale.

### 2.6 AI Recruitment CRM

Move beyond basic job board functionality into a **hiring operations platform**:

- Automated follow-up sequences
- Candidate lifecycle tracking (awareness → interest → applied → hired → deployed)
- Full hiring funnel visualization
- Pipeline automation (auto-move stages based on triggers)
- Smart reminders and tagging
- AI-generated candidate summaries for hiring managers
- Bulk actions for enterprise hiring

### 2.7 Desktop Recruitment Assistant (Electron)

An Electron desktop app for power recruiters:

- Real-time hiring alerts (system tray notifications)
- Quick candidate search (global hotkey)
- Pipeline monitor (live updates)
- AI assistant popup (voice/text queries)
- Drag-and-drop CV parsing
- Offline access to cached candidates

### 2.8 Offline + QR Recruitment Ecosystem

Uniquely valuable in African markets with limited internet penetration:

- QR-powered recruitment drives at job fairs
- Instant candidate profile creation via QR scan
- Booth analytics (footfall, scan rates, conversion)
- Attendance tracking for events
- AI-powered event summaries and lead scoring
- Offline-to-online synchronization (scan QR → profile created when online)

Bridges **offline employment ecosystems** with **digital recruitment**.

### 2.9 AI Job Intelligence Layer

The long-term competitive moat. Track and monetize:

- Sponsorship trends by country and industry
- Visa demand forecasting
- Salary intelligence (real-time comps by role, country, experience)
- Migration demand patterns
- Emerging skills and declining roles
- Regional hiring heatmaps
- Employer reputation scores

Monetizable as: premium reports, data APIs, government/NGO consulting, workforce planning dashboards.

### 2.10 Monetization Architecture (Expanded)

#### Employers
- AI recruiting assistant subscriptions (monthly/ annual)
- Premium sourcing credits (beyond free tier)
- AI candidate ranking unlocks
- Automated outreach campaigns (pay-per-candidate)
- Featured AI campaigns (boosted visibility)

#### Job Seekers
- Premium AI resume optimization ($9.99)
- AI interview coaching ($14.99)
- Sponsorship matching premium tier
- Migration/job intelligence reports

#### Governments / NGOs / Development Orgs
- Labor market analytics subscriptions
- Employment reports and workforce dashboards
- Skills gap analysis for policy planning
- Regional migration data insights

---

## 4. SITE RESTRUCTURING STRATEGY

### Current Site Structure (Simplified)
```
/ (Home)
├── /jobs (Job listings)
├── /jobs/:id (Job detail)
├── /ai-matching (AI matching)
├── /admin (Admin panel)
├── /pricing
├── /resources
├── /login
└── /register
```

### Restructured Site Architecture
```
/ (Home - Combined job seeker + employer landing)
├── /jobs (Job listings)
│   ├── / (Full-time, Part-time, Freelance, Remote, Contract, Temporary tabs)
│   ├── /:id (Job detail with AI match score)
│   └── /category/:industry (Industry-specific job listing)
│
├── /employers (NEW - Complete employer hub)
│   ├── / (Landing page with all sections)
│   ├── /dashboard (Employer dashboard)
│   ├── /post-job (Job posting wizard)
│   ├── /candidates (Verified candidate browser)
│   ├── /analytics (Recruitment analytics)
│   └── /team (Recruiter management)
│
├── /candidates (NEW - Candidate marketplace)
│   ├── / (Browse all candidates)
│   ├── /:id (Candidate profile with badges)
│   └── /verify (Verification status)
│
├── /freelance (NEW - Gig marketplace)
│   ├── / (Browse gigs)
│   ├── /post (Post a gig)
│   └── /contracts (Manage contracts)
│
├── /recruitment (NEW - Agency portal)
│   ├── / (Agency landing)
│   ├── /dashboard (Agency dashboard)
│   └── /deployments (Deployment tracking)
│
├── /ai-matching (Enhanced AI suite)
├── /pricing (Subscription tiers)
├── /resources (Career resources hub)
├── /about
├── /contact
├── /login
└── /register
```

---

## 5. UI/UX ARCHITECTURE

### Design System

#### Color Palette
```
Primary Brand:    #FFBF00 (Gold/Yellow - existing)
Employer Theme:   #070B2E → #0F1F3D → #1A2D56 (Navy gradient)
Accent:           #3B82F6 → #60A5FA → #2563EB (Electric Blue)
Success:          #10B981 (Emerald)
Warning:          #F59E0B (Amber)
Error:            #EF4444 (Red)
Text Primary:     #111827 (Gray 900)
Text Secondary:   #6B7280 (Gray 500)
Background:       #F9FAFB (Gray 50)
```

#### Typography
- Headings: `Space Grotesk` (font-heading) — font-black, tracking-tight
- Body: `Plus Jakarta Sans` (font-sans) — font-medium
- Scale: text-xs(12) → text-sm(14) → text-base(16) → text-lg(18) → text-xl(20) → text-2xl(24) → text-3xl(30) → text-4xl(36) → text-5xl(48) → text-6xl(60) → text-7xl(72)

#### Component Hierarchy
```
App
├── ThemeProvider (next-themes)
├── Router (wouter)
│   ├── PublicLayout [Navbar + main + Footer]
│   │   ├── Home (/)
│   │   ├── Jobs (/jobs)
│   │   ├── JobDetail (/jobs/:id)
│   │   ├── Employers (/employers)
│   │   │   ├── HeroSection
│   │   │   ├── TrustedBySection
│   │   │   ├── SolutionsSection
│   │   │   ├── AIFeaturesSection
│   │   │   ├── VerificationBadgesSection
│   │   │   ├── PipelineSection
│   │   │   ├── IndustryHiringSection
│   │   │   ├── InternationalSection
│   │   │   ├── PricingSection
│   │   │   ├── TestimonialsSection
│   │   │   └── GlobalCTASection
│   │   ├── AIMatching (/ai-matching)
│   │   ├── Pricing (/pricing)
│   │   └── Resources (/resources)
│   │
│   ├── EmployerDashboard (/employer/dashboard)
│   │   ├── Sidebar (nav items)
│   │   ├── TopBar (search + notifications + actions)
│   │   └── TabContent
│   │       ├── OverviewTab
│   │       │   ├── StatsGrid
│   │       │   ├── AIRecommendations
│   │       │   ├── RecentApplicants
│   │       │   └── PipelinePreview
│   │       ├── JobsTab
│   │       │   ├── JobListTable
│   │       │   └── JobActions
│   │       ├── CandidatesTab
│   │       │   └── CandidateGrid
│   │       ├── MessagesTab
│   │       │   ├── ConversationList
│   │       │   └── ChatView
│   │       ├── AnalyticsTab
│   │       │   ├── HiringFunnel
│   │       │   └── SourceBreakdown
│   │       └── TeamTab
│   │           └── TeamMemberTable
│   │
│   ├── Admin (/admin)
│   └── NotFound
```

---

## 6. DATABASE SCHEMA SUGGESTIONS

### Core Entities (PostgreSQL via Supabase)

```sql
-- =====================
-- USER MANAGEMENT
-- =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('jobseeker', 'employer', 'recruiter', 'agency', 'admin') NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  company_website TEXT,
  company_size VARCHAR(50),
  industry VARCHAR(255),
  headquarters_location VARCHAR(255),
  gulf_business_license TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  recruiter_seats INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- VERIFICATION SYSTEM
-- =====================
CREATE TABLE candidate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES users(id),
  
  -- 7-Point Verification Badges
  passport_verified BOOLEAN DEFAULT false,
  passport_number VARCHAR(100),
  passport_expiry DATE,
  
  identity_verified BOOLEAN DEFAULT false,
  identity_document_type VARCHAR(50),
  identity_document_url TEXT,
  
  experience_verified BOOLEAN DEFAULT false,
  experience_verified_by VARCHAR(255),
  experience_document_url TEXT,
  
  police_clearance BOOLEAN DEFAULT false,
  police_clearance_date DATE,
  police_clearance_url TEXT,
  
  medical_cleared BOOLEAN DEFAULT false,
  medical_clearance_date DATE,
  medical_clearance_url TEXT,
  
  visa_ready BOOLEAN DEFAULT false,
  target_countries TEXT[], -- ['Qatar', 'UAE', 'Saudi Arabia']
  
  language_certified BOOLEAN DEFAULT false,
  languages JSONB, -- [{"language": "English", "level": "Fluent"}, {"language": "Arabic", "level": "Intermediate"}]
  
  verification_score INTEGER DEFAULT 0, -- 0-100 calculated from badges
  overall_status ENUM('pending', 'partial', 'fully_verified') DEFAULT 'pending',
  
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
= JOB & RECRUITMENT
-- =====================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employer_profiles(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  employment_type ENUM('full-time', 'part-time', 'freelance', 'contract', 'temporary', 'gig'),
  industry VARCHAR(255),
  category VARCHAR(255),
  experience_level ENUM('entry', 'mid', 'senior', 'executive'),
  
  -- Location & Remote
  location VARCHAR(255),
  country VARCHAR(100),
  is_remote BOOLEAN DEFAULT false,
  visa_sponsored BOOLEAN DEFAULT false,
  target_country VARCHAR(100), -- Gulf country for deployment
  
  -- Compensation
  salary_min NUMERIC(10,2),
  salary_max NUMERIC(10,2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  salary_period ENUM('hourly', 'monthly', 'yearly') DEFAULT 'monthly',
  
  -- Hiring Details
  positions_available INTEGER DEFAULT 1,
  urgency ENUM('normal', 'urgent', 'immediate'),
  is_featured BOOLEAN DEFAULT false,
  ai_match_threshold INTEGER DEFAULT 70,
  
  status ENUM('draft', 'active', 'paused', 'filled', 'closed') DEFAULT 'draft',
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES users(id),
  
  pipeline_stage ENUM('applied', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'deployed') DEFAULT 'applied',
  ai_match_score INTEGER,
  employer_notes TEXT,
  
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  shortlisted_at TIMESTAMP,
  interviewed_at TIMESTAMP,
  hired_at TIMESTAMP,
  deployed_at TIMESTAMP
);

-- =====================
-- AI MATCHING & ANALYTICS
-- =====================
CREATE TABLE ai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES users(id),
  
  match_score INTEGER NOT NULL, -- 0-100
  skill_match_score INTEGER,
  experience_score INTEGER,
  language_score INTEGER,
  location_score INTEGER,
  visa_readiness_score INTEGER,
  
  matched_skills TEXT[],
  skill_gaps TEXT[],
  ai_insights TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recruitment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employer_profiles(id),
  
  date DATE NOT NULL,
  total_applications INTEGER DEFAULT 0,
  total_interviews INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  total_deployments INTEGER DEFAULT 0,
  
  ai_matches INTEGER DEFAULT 0,
  average_match_score NUMERIC(5,2),
  average_time_to_hire INTEGER, -- in days
  cost_per_hire NUMERIC(10,2),
  
  source_breakdown JSONB, -- {"direct": 45, "ai_match": 30, "referral": 15, "agency": 10}
  pipeline_counts JSONB, -- {"applied": 100, "reviewed": 60, ...}
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- MESSAGING SYSTEM
-- =====================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL, -- [user1_id, user2_id]
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  content TEXT,
  message_type ENUM('text', 'voice', 'file', 'interview_invite') DEFAULT 'text',
  attachment_url TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- SUBSCRIPTION & BILLING
-- =====================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employer_profiles(id),
  
  tier ENUM('free', 'professional', 'enterprise', 'agency') DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  status ENUM('active', 'canceled', 'past_due', 'trialing') DEFAULT 'trialing',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  
  recruiter_seats INTEGER DEFAULT 1,
  ai_matches_limit INTEGER DEFAULT 100,
  candidate_unlocks INTEGER DEFAULT 50,
  featured_jobs INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- INTERNATIONAL DEPLOYMENT
-- =====================
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  candidate_id UUID REFERENCES users(id),
  employer_id UUID REFERENCES employer_profiles(id),
  
  source_country VARCHAR(100) NOT NULL, -- e.g. Uganda
  destination_country VARCHAR(100) NOT NULL, -- e.g. Qatar
  
  -- Workflow Stages
  passport_stage ENUM('pending', 'submitted', 'verified') DEFAULT 'pending',
  visa_stage ENUM('pending', 'applied', 'approved', 'rejected') DEFAULT 'pending',
  medical_stage ENUM('pending', 'scheduled', 'cleared', 'failed') DEFAULT 'pending',
  contract_stage ENUM('pending', 'signed', 'countered') DEFAULT 'pending',
  travel_stage ENUM('pending', 'booked', 'departed', 'arrived') DEFAULT 'pending',
  
  deployment_status ENUM('onboarding', 'in_process', 'deployed', 'completed', 'cancelled') DEFAULT 'onboarding',
  
  departure_date DATE,
  arrival_date DATE,
  contract_end_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_industry ON jobs(industry);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_applications_pipeline ON applications(pipeline_stage);
CREATE INDEX idx_ai_matches_score ON ai_matches(match_score DESC);
CREATE INDEX idx_candidates_verification ON candidate_verifications(verification_score DESC);
CREATE INDEX idx_deployments_status ON deployments(deployment_status);
CREATE INDEX idx_deployments_route ON deployments(source_country, destination_country);
```

---

## 7. AI FEATURE ARCHITECTURE

### AI Pipeline
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Resume/CV   │ →  │   AI Parser  │ →  │   Matching   │ →  │  Candidate   │
│  Upload      │    │  (OpenAI)    │    │   Engine     │    │  Ranking     │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                ↓
                    ┌──────────────┐    ┌─────────────┐
                    │   Interview  │ ←  │ Shortlisting │
                    │  Questions   │    │   Engine     │
                    │  Generator   │    │              │
                    └──────────────┘    └─────────────┘
```

### AI Models & Services
```
┌─────────────────────────────────────────────────────────────┐
│                    AI SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐   ┌──────────────────┐                │
│  │  Resume Parser   │   │  Match Scoring   │                │
│  │  - OpenAI GPT-4  │   │  - Skill match   │                │
│  │  - Skill extract │   │  - Experience    │                │
│  │  - Experience    │   │  - Language      │                │
│  │  - Education     │   │  - Location      │                │
│  │  - Certifications│   │  - Visa status   │                │
│  └─────────────────┘   └──────────────────┘                │
│                                                             │
│  ┌─────────────────┐   ┌──────────────────┐                │
│  │  JD Generator   │   │  Interview Qs    │                │
│  │  - Role-based   │   │  - Role-specific │                │
│  │  - Industry     │   │  - Skill-based   │                │
│  │  - Inclusive    │   │  - Experience    │                │
│  │  - Optimized    │   │  - Behavioral    │                │
│  └─────────────────┘   └──────────────────┘                │
│                                                             │
│  ┌─────────────────┐   ┌──────────────────┐                │
│  │  Hiring Insights│   │  Chatbot/Assistant│               │
│  │  - Market data  │   │  - 24/7 support  │                │
│  │  - Salary trends│   │  - Q&A           │                │
│  │  - Demand       │   │  - Guidance      │                │
│  │  - Competition  │   │  - Multi-lang    │                │
│  └─────────────────┘   └──────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow for AI Matching
```
1. Employer posts job → Job data stored in jobs table
2. AI Service triggered → 
   a. Parse job description → Extract required skills, experience, qualifications
   b. Generate embedding vector → Store in vector DB (pgvector)
3. Candidate uploads/syncs resume →
   a. Parse resume → Extract skills, experience, education
   b. Generate embedding vector → Store in vector DB
4. Matching Engine →
   a. Cosine similarity on embeddings
   b. Weighted scoring (skills 40%, experience 25%, location 15%, visa 10%, language 10%)
   c. Return top matches with scores
5. Employer reviews matches → AI explains match reasons
6. Candidate moves through pipeline → AI continues to learn
```

---

## 8. EMPLOYER ONBOARDING FLOW

```
                    EMPLOYER ONBOARDING
┌─────────────────────────────────────────────────────────┐

Step 1: Landing → CTA "Post a Job" or "Get Started"
         ↓
Step 2: Registration
         ├── Email/Password or Google OAuth
         ├── Company name, size, industry
         └── Role selection: Employer / Agency
         ↓
Step 3: Company Profile
         ├── Company logo, website, description
         ├── Office location(s)
         ├── Gulf business license (for verification)
         └── Target hiring countries
         ↓
Step 4: Choose Plan
         ├── Free (3 jobs, basic AI)
         ├── Professional ($299/mo, full AI)
         └── Enterprise (Custom, bulk features)
         ↓
Step 5: First Job Post
         ├── AI-assisted job description generator
         ├── Required skills, experience, certifications
         ├── Target country & visa info
         └── AI match threshold setting
         ↓
Step 6: Dashboard Tour
         ├── Overview stats
         ├── AI matching results
         ├── Candidate pipeline
         └── Team invitations
         ↓
Step 7: First Candidate Review
         ├── AI-ranked candidate list
         ├── Verification badges overview
         ├── Quick actions: Shortlist, Message, Interview
         └── Deployment workflow preview

└─────────────────────────────────────────────────────────┘
```

---

## 9. MONETIZATION STRATEGY

### Pricing Tiers

| Feature | Free | Professional ($299/mo) | Enterprise (Custom) | Agency ($499/mo) |
|---------|------|----------------------|---------------------|------------------|
| Job Posts | 3 active | Unlimited | Unlimited | 50 per client |
| AI Matching | Basic | Advanced | Full Suite | White-label |
| Candidate Views | 10/mo | 500/mo | Unlimited | Unlimited |
| Verification Access | Basic | Full badges | Full + Priority | Full |
| Pipeline Management | ❌ | ✅ | Custom | ✅ |
| Bulk Hiring | ❌ | Up to 25 | Unlimited | Unlimited |
| International Deployment | ❌ | ❌ | ✅ | ✅ |
| Team Seats | 1 | 3 | Unlimited | 10 |
| API Access | ❌ | ❌ | ✅ | ✅ |
| Analytics | Basic | Advanced | Custom reports | Full |
| Support | Email | Priority | Dedicated Manager | Priority |
| White-label | ❌ | ❌ | Option | ✅ |

### Revenue Streams
```
1. Subscriptions (MRR)
   ├── Professional: $299/mo → $3,588/yr
   ├── Enterprise: $2,000-10,000/mo → $24,000-120,000/yr
   └── Agency: $499/mo → $5,988/yr

2. Per-Job Fees
   ├── Featured job posts: $49 each
   ├── Urgent hiring: $79 each
   └── Visa sponsorship posting: $99

3. Candidate Unlocks
   ├── Beyond free tier: $5/candidate profile
   ├── Video profile view: $3/view
   └── Direct contact: $10/unlock

4. Placement Fees (% of salary)
   ├── Permanent: 15-20% of annual salary
   ├── Contract: 10-15% of contract value
   └── Bulk hiring: Negotiated volume rates

5. International Deployment
   ├── Visa processing: $500-2,000 per worker
   ├── Medical clearance coordination: $100-300
   ├── Travel & relocation: Commission basis
   └── Compliance & documentation: $200-500

6. Value-Added Services
   ├── Recruitment analytics: $99/mo add-on
   ├── Custom integrations: Setup fee + $199/mo
   ├── Employer branding package: $299/mo
   └── Priority AI matching: $149/mo
```

### Revenue Projections (Year 1)
```
Tier        Customers    ARPU     Monthly     Annual
Free        200          $0       $0          $0
Professional 50          $299     $14,950     $179,400
Enterprise   10          $5,000   $50,000     $600,000
Agency       15          $499     $7,485      $89,820
Placements   200          $2,000  $40,000     $400,000*
Deployment   100         $1,000   $12,500     $150,000*

Total: $1,419,220 ARR (Year 1 conservative)
*One-time fees
```

---

## 10. RECRUITMENT WORKFLOW DIAGRAMS

### Basic Hiring Flow
```
EMPLOYER                         PLATFORM                    CANDIDATE
   │                                │                           │
   ├── Posts job ──────────────────►│                           │
   │                                ├── AI parses & embeds      │
   │                                ├── Generates JD            │
   │                                │                           │
   │                                │◄────── Applies/Matched ───┤
   │                                ├── AI calculates score     │
   │◄──── Receives ranked list ─────┤                           │
   │                                │                           │
   ├── Reviews candidates           │                           │
   ├── Shortlists top matches ─────►│                           │
   │                                ├── Notifies candidate ────►│
   │                                │                           │
   ├── Schedules interview ────────►│◄──── Confirms ───────────┤
   │◄──── Interview feedback ───────┤                           │
   │                                │                           │
   ├── Extends offer ──────────────►│◄──── Accepts ────────────┤
   │                                ├── Initiates deployment    │
   │                                │                           │
   │◄──── Deployment tracking ──────┤◄──── Updates status ─────┤
   │                                │                           │
```

### Bulk Hiring Flow
```
┌──────────────────────────────────────────────────────────────────┐
│                    BULK HIRING WORKFLOW                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: Requirements → Industry, role, count, timeline,         │
│                         target gulf country, salary range         │
│         ↓                                                        │
│  Step 2: AI Batch Matching → System scans 50K+ candidates        │
│         ↓                                                        │
│  Step 3: Bulk Shortlist → AI pre-screens top 200 candidates      │
│         ↓                                                        │
│  Step 4: Bulk Verification → Batch verification queue            │
│         ├── Passport check (automated)                            │
│         ├── Medical screening (scheduled)                         │
│         └── Skills assessment (batch testing)                     │
│         ↓                                                        │
│  Step 5: Employer Review → Review batches of 10 at a time        │
│         ↓                                                        │
│  Step 6: Group Interviews → Batch video interviews               │
│         ↓                                                        │
│  Step 7: Mass Onboarding → Document collection, contracts,       │
│                            visa applications                      │
│         ↓                                                        │
│  Step 8: Deployment → Coordinated departure & arrival             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. MOBILE RESPONSIVENESS PLAN

### Breakpoints
```
Mobile:     320px - 640px
Tablet:     641px - 1024px
Desktop:    1025px - 1440px
Wide:       1441px+
```

### Mobile-First Design Decisions
```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE OPTIMIZATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Navigation:                                                │
│  └── Bottom tab bar (mobile) vs top nav (desktop)          │
│                                                             │
│  Employer Page:                                             │
│  └── Single column layout → Multi-column grid               │
│  └── Collapsible sections with accordion                    │
│  └── Touch-friendly CTAs (min 48px height)                 │
│  └── Swipeable testimonial carousel                         │
│                                                             │
│  Dashboard:                                                 │
│  └── Slide-in sidebar (drawer pattern)                      │
│  └── Stacked cards → Horizontal scroll on tablet            │
│  └── Bottom sheet for filters/actions                       │
│  └── Simplified tables → Card list view                     │
│                                                             │
│  Performance:                                               │
│  └── Lazy load images and components                        │
│  └── Reduced motion queries for animations                  │
│  └── Optimized bundle with code splitting                   │
│  └── Service worker for offline capability                  │
│                                                             │
│  Bandwidth Optimization:                                    │
│  └── Image compression (WebP + AVIF)                        │
│  └── Font subsetting                                        │
│  └── Preconnect to critical origins                         │
│  └── Minimal initial bundle (~50KB)                         │
│                                                             │
│  Gulf/Africa UX Patterns:                                   │
│  └── WhatsApp deep links for communication                  │
│  └── RTL support for Arabic                                 │
│  └── Low-bandwidth mode toggle                              │
│  └── SMS notifications fallback                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. FUTURE SCALABILITY ROADMAP

### Phase 1: Foundation (Month 1-2) ✅ CURRENT
```
☑ Employer landing page redesign
☑ Employer dashboard
☑ AI matching integration
☑ Candidate verification badges
☑ Pipeline management UI
☑ Basic pricing page
```

### Phase 2: Growth (Month 3-4)
```
□ Subscription & billing (Stripe)
□ Employer onboarding wizard
□ Bulk hiring workflow
□ International deployment tracking
□ Video profile uploads
□ WhatsApp integration
□ AI Job Description Generator (quick win - 1 day with existing LLM infra)
□ Social share buttons on job listings (LinkedIn, X, WhatsApp, Telegram)
```

### Phase 3: Scale (Month 5-6)
```
□ AI Multi-Agent System (Sourcing, Matching, Resume, JD agents)
□ Recruitment Browser Extension v1 (Plasmo - LinkedIn profile import + AI scoring)
□ MCP Protocol Server (expose conversational recruitment API)
□ AI Resume Intelligence (ATS scoring, tailoring, cover letter gen)
□ Freelance/gig marketplace
□ Payment & escrow system
□ Agency portal with white-label
□ AI chatbot (24/7 hiring assistant)
```

### Phase 4: Expansion (Month 7-9)
```
□ Recruiter Desktop App (Electron - system tray, pipeline monitor, AI popup)
□ Social Recruitment Syndication Engine (auto-post to 8+ platforms)
□ Recruitment Engagement Mining (intent detection from social platforms)
□ AI Recruitment CRM (automated follow-up, lifecycle tracking, pipeline automation)
□ Multi-language support (Swahili, Amharic, Somali)
□ Blockchain credential verification
□ Predictive hiring analytics
□ Browser Extension v2 (job seeker features: instant apply, sponsorship scoring)
```

### Phase 5: Enterprise (Month 10-12)
```
□ Offline + QR Recruitment Ecosystem (job fairs, booth analytics)
□ Labor Market Intelligence Dashboard (salary trends, hiring heatmaps, migration data)
□ API marketplace for third-party integrations
□ Custom enterprise dashboards
□ Automated compliance & contracts (GCC labor law)
□ Advanced fraud detection (AI scam detection for job posts)
□ MCP Protocol v2 (autonomous agent support, webhook triggers)
□ Virtual recruitment events platform
□ Skills assessment center
□ Partnership network with training centers
```

---

## 13. KEY METRICS & KPIs

### Employer-Side Metrics
```
Time-to-hire:       Target < 14 days (from posting to offer)
Cost-per-hire:      Target < $500
AI match accuracy:  Target > 90%
Candidate response: Target < 24 hours
Interview-show rate: Target > 80%
Offer acceptance:   Target > 85%
Retention (90 days): Target > 90%
```

### Platform Metrics
```
MAU (Monthly Active Users):        10,000+
Jobs posted:                        500+/month
Applications submitted:             5,000+/month
AI matches generated:               50,000+/month
Successful placements:              200+/month
Deployments completed:              100+/month
NPS Score:                          Target > 60
```

---

## 14. SECURITY & COMPLIANCE

### Data Protection
- End-to-end encryption for messages
- GDPR compliance
- Qatar & UAE data residency
- SOC 2 Type II certification (target)

### Verification Security
- Liveness detection for identity verification
- Blockchain-anchored credential verification
- Document tampering detection (AI)
- Biometric matching

### Fraud Prevention
- Employer business license verification
- Candidate identity cross-referencing
- Duplicate detection (AI)
- Suspicious pattern monitoring
- Rate limiting & abuse detection

---

## 15. TECHNOLOGY STACK (CURRENT + EVOLVED VISION)

### Current Stack
```
Frontend:        Vite + React 19 + TypeScript + TailwindCSS 4
UI Library:      Radix UI Primitives + shadcn/ui
Animation:       Framer Motion
Routing:         wouter
State:           TanStack React Query
Charts:          Recharts
Auth:            Custom JWT-based
API:             Express 5 (in api-server)
Database:        PostgreSQL (via Supabase) + Drizzle ORM
AI/LLM:          OpenAI SDK via OpenRouter
File Parsing:    pdf-parse + mammoth (PDF/DOCX)
Scraping:        Cheerio + Axios (6 job board scrapers)
```

### Target Stack (Evolved Vision)

| Layer | Recommendation |
|-------|---------------|
| Frontend | Next.js 15 (migration path from Vite/React) |
| UI | Tailwind 4 + shadcn/ui (keep existing) |
| Backend | NestJS monorepo (Nx) — modular microservices architecture |
| AI Orchestration | LangGraph or CrewAI (multi-agent system) |
| Vector Search | pgvector (PostgreSQL extension) |
| Database | PostgreSQL (Supabase) |
| Queue System | BullMQ (background job processing) |
| Realtime | Supabase Realtime + WebSocket |
| AI APIs | OpenAI + Gemini + OpenRouter (multi-provider) |
| Browser Extension | Plasmo framework |
| Desktop App | Electron (recruiter assistant) |
| Auth | Clerk or custom JWT |
| File Storage | Supabase Storage / Cloudflare R2 |
| Search | Hybrid semantic + keyword (pgvector + Meilisearch) |
| AI Memory | Redis (caching + session state) |
| MCP | FastMCP / Model Context Protocol SDK |
| Payments | Stripe Connect |
| Email | Resend or SendGrid |
| SMS | Twilio or Africa's Talking |
| WhatsApp | Twilio WhatsApp API / WATI |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + PostHog |
| Event/Scraping | GitHub Actions cron + BullMQ workers |

---

## 16. MASTER PROMPT — OpJobHub: AI Recruitment Operating System

Use this prompt for planning, AI coding assistants, architecture generation, or investor/developer documentation:

> Build an advanced AI-powered recruitment ecosystem called OpJobHub that evolves beyond a traditional job board into a full **Employment Operating System for Africa and the Middle East**.
>
> The platform should combine:
> - AI recruitment automation
> - intelligent candidate sourcing
> - multi-platform job syndication
> - AI resume intelligence
> - conversational AI assistants
> - labor market analytics
> - browser extension recruitment tooling
> - MCP AI assistant integrations
> - recruiter CRM workflows
> - semantic matching systems
> - real-time engagement automation
>
> Core vision: Transform hiring from a manual process into an autonomous AI-assisted workflow.
>
> Key modules to build:
>
> 1. **AI Multi-Agent Recruitment Architecture** — Specialized AI agents: Sourcing Agent, Resume Analysis Agent, Job Description Generator Agent, Candidate Match Scoring Agent, Outreach & Follow-up Agent, Recruitment Marketing Agent, Analytics & Reporting Agent, Interview Scheduling Agent, Verification & Compliance Agent
>
> 2. **Browser Extension (Plasmo)** — One-click import of LinkedIn/Indeed/Bayt candidates, AI-powered profile scoring while browsing, auto-save candidates into recruitment pipelines, auto-post jobs to LinkedIn/X/Facebook/Telegram/WhatsApp, instant resume/job analysis
>
> 3. **MCP Protocol Integration** — Expose MCP-compatible recruitment API allowing Claude/Cursor/AI assistants to search jobs, conversational resume feedback, recruiter analytics querying, AI-assisted hiring workflows, candidate search via natural language
>
> 4. **AI Resume Intelligence System** — ATS scoring, semantic skill extraction, sponsorship eligibility prediction, salary intelligence, missing skills detection, AI-generated resume improvements, cover letter generation, career path recommendations
>
> 5. **Semantic AI Matching Engine** — Use embeddings + vector search (pgvector) to match candidates to jobs semantically, score cultural and technical fit, recommend relocation/sponsorship opportunities, detect hidden candidate-job compatibility
>
> 6. **Multi-Platform Recruitment Syndication** — Automatically distribute jobs to LinkedIn, X/Twitter, Facebook, Instagram, WhatsApp Channels, Telegram groups, partner job boards. Generate captions, hashtags, recruitment posters, short-form hiring content, localized platform-specific messaging
>
> 7. **AI Recruitment CRM** — Pipeline management, automated follow-ups, candidate reminders, AI-generated summaries, interview scheduling, hiring funnel analytics
>
> 8. **Engagement Mining System** — Detect job-seeking intent signals from social platforms ("looking for work", "need sponsorship", "open to relocation"), recommend matching jobs, trigger AI outreach, nurture passive candidates
>
> 9. **Desktop Recruitment Assistant (Electron)** — Real-time recruiter notifications, quick candidate search, pipeline monitoring, AI hiring assistant, drag-and-drop resume parsing
>
> 10. **Offline Recruitment Ecosystem** — QR-powered recruitment drives, job fairs, candidate booth registration, event analytics, offline-to-online recruitment synchronization
>
> 11. **Labor Market Intelligence Dashboard** — Salary trends, sponsorship trends, hiring heatmaps, in-demand skills, migration/employment analytics, workforce intelligence reports
>
> Technical stack: Next.js 15, Tailwind CSS, shadcn/ui, NestJS, PostgreSQL + pgvector, Supabase, BullMQ, Redis, LangGraph or CrewAI, OpenAI + Gemini + OpenRouter, Plasmo browser extension, Electron desktop app, MCP server integration.
>
> The final platform should feel like: **"An AI-native employment infrastructure platform that automates recruitment, workforce intelligence, candidate engagement, and career growth across Africa and the Middle East."**

---

## 12. POST-PHASE 5 STRATEGIC DIRECTION

### The Shift: From Feature-Building to Systems Engineering

The platform has crossed the threshold from "AI-powered recruitment software" to **"self-improving recruitment infrastructure."** This changes the build strategy:

| Before | After |
|--------|-------|
| AI feature layering | Intelligence optimization |
| Recruiter utilities | Adaptive learning systems |
| Job marketplace features | Enterprise infrastructure |
| Prompt-driven agents | Behaviorally adaptive agents |
| Static scoring | Confidence-weighted evolution |

### Correct Strategic Sequence

| Order | Priority | Rationale |
|-------|----------|-----------|
| **Phase 5A** | Adaptive Intelligence Engine | Learning recruitment system — compounds all other features |
| **Phase 5B** | Observability + Human Override | Trust infrastructure for adaptive AI |
| **Phase 6** | Autonomous Sourcing | Continuous talent discovery (quality depends on preference intelligence first) |
| **Phase 7** | Knowledge Graph (Neo4j) | Workforce intelligence graph (richer with behavioral data first) |
| **Phase 8** | Hiring Simulation Engine | Predictive intelligence (needs historical outcome data) |
| **Phase 9** | Labor Market Intelligence | B2B/government revenue layer |
| **Phase 10** | Enterprise Governance | Audit, compliance, SLA, permissions |

### Phase 5A Architecture: Adaptive Intelligence Engine

#### Layers Built

```
┌─────────────────────────────────────────────┐
│         Preference Embedding Layer           │
│  (pgvector embeddings for contextual ranking)│
├─────────────────────────────────────────────┤
│      Confidence-Weighted Memory System       │
│  (decay · reinforcement · contradiction)     │
├─────────────────────────────────────────────┤
│        Preference Inference Engine           │
│  (skill · location · experience · cert)     │
├─────────────────────────────────────────────┤
│       Behavioral Signal Collection Layer     │
│  (hired +1.0 · shortlisted +0.6 · rejected  │
│   -0.5 · ghosted -0.6 · rapid_rejected -0.8)│
├─────────────────────────────────────────────┤
│     Recruiter Actions → Signals Wiring      │
│  (status updates · follow-ups · pipeline)   │
└─────────────────────────────────────────────┘
```

#### New Database Tables
- `behavioral_signals` — raw recruiter action events with signal strength (-1.0 to 1.0)
- `inferred_preferences` — auto-detected preferences with confidence, supporting signals, decay tracking
- `preference_embeddings` — vector embeddings for contextual semantic matching

#### Signal Strength Mapping
| Recruiter Action | Signal Strength | Category |
|-----------------|----------------|----------|
| hired | +1.0 | strong_positive |
| interview_completed | +0.8 | positive |
| outreach_replied | +0.7 | positive |
| shortlisted | +0.6 | positive |
| outreach_sent | +0.5 | positive |
| sourced | +0.3 | neutral |
| viewed | +0.1 | neutral |
| ignored | -0.2 | negative |
| rejected | -0.5 | negative |
| ghosted | -0.6 | strong_negative |
| rapid_rejected | -0.8 | strong_negative |

#### Confidence-Weighted Evolution
- **Reinforcement**: Matching behaviors increase confidence (diminishing returns toward 0.98)
- **Decay**: Unreinforced preferences lose 0.1 confidence per 30 days
- **Contradiction**: Opposite behaviors reduce conflicting preference confidence by 15%
- **Deactivation**: Preferences below 0.1 confidence for 7+ days auto-deactivate
- **Inference trigger**: Every 10th signal triggers background pattern inference

#### Frontend: Agents Tab (Enhanced)
- 4 status cards: Orchestrator · Events · Inferred Preferences · Learning Progress
- Pipeline Runner (unchanged)
- Adaptive Intelligence Controls: Infer, Decay, Embed, Load Profile
- Inferred Preferences panel: confidence badges, source, signal count, decay indicator
- Behavioral Signals log: color-coded by strength, with timestamps
- Consolidated Recruiter Profile: manual + inferred + avoided skills + stats
- Learning documentation explaining the three-stage pipeline

#### API Endpoints Added
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/agents/signals/record` | Record a behavioral signal |
| GET | `/agents/signals` | Get signals for employer |
| POST | `/agents/preferences/infer` | Trigger preference inference |
| GET | `/agents/preferences/inferred` | Get inferred preferences |
| POST | `/agents/preferences/decay` | Decay stale preferences |
| GET | `/agents/preferences/summary` | Get learning summary |
| GET | `/agents/preferences/consolidated` | Get full recruiter profile |
| POST | `/agents/embeddings/generate` | Generate preference embeddings |

### Key Strategic Insight

The system now learns from recruiter behavior automatically:

**Before Phase 5A:**
```
Recruiter sets preferences manually
```

**After Phase 5A:**
```
System infers recruiter behavior automatically
```

This creates a **compounding intelligence loop**: more recruiter actions → better preference inference → better sourcing/ranking → better hiring outcomes → more recruiter engagement → more signals → even better inference.

---

## Phase 5B Architecture: Observability + Human Override

### Strategic Importance

The platform now learns autonomously, adapts recruiter preferences, and changes ranking behavior over time. This makes AI decisions directly influence hiring outcomes. Phase 5B builds the **governance infrastructure for autonomous AI systems** — transforming powerful AI into trusted AI infrastructure.

### Why This Must Come Before Scale

Without observability and human override:
- Recruiters lose trust in AI decisions
- Enterprises hesitate to adopt
- Bias risks increase
- Automation becomes dangerous

### New Database Tables (6)

| Table | Purpose |
|-------|---------|
| `agent_reasoning_logs` | Structured AI reasoning artifacts for every decision |
| `approval_workflows` | Human approval states with confidence-based execution |
| `override_events` | Recruiter override tracking for reinforcement learning |
| `safety_flags` | Risk events: bias, drift, hallucinations, threshold breaches |
| `drift_metrics` | Intelligence drift tracking over time windows |
| `agent_metrics` | Performance telemetry (latency, success rate, executions) |

### Core Services Built

#### 1. Reasoning Engine (`reasoning-engine.ts`)
- Generates structured decision artifacts with factor-level reasoning
- Each factor includes: name, weight (0-1), source (inferred_preference, semantic_match, behavioral_learning, skill_match, etc.)
- Supports explainable ranking, outreach, sourcing decisions
- `explainRanking(candidateId, jobId)` — retrieve why a specific candidate was ranked a certain way

#### 2. Approval Manager (`approval-manager.ts`)
- Confidence-based automation thresholds (default: 0.95)
- Actions above threshold → `auto_executed`; below → `pending_approval`
- Approval states: `suggested` → `pending_approval` → `approved` | `rejected` | `auto_executed`
- Recruiters can approve, reject with reason, and view history/stats
- Threshold stored in `recruiter_memory` for per-employer customization

#### 3. Safety Engine (`safety-engine.ts`)
- **Confidence Gates**: Actions below minimum confidence are blocked with flag raised
- **Bias Detection**: Monitors location bias (>90% from preferred locations) and skill homogeneity (>85% from preferred set)
- **Drift Detection**: Tracks metric changes over time, raises flags on >30% drift
- **Severity Levels**: `info` → `warning` → `critical` (critical triggers SYSTEM_ALERT event)

#### 4. Observability Service (`observability-service.ts`)
- Agents can push arbitrary metrics (`recordMetric`)
- Dashboard aggregator returns: agent health, decision analytics, approval stats, safety summary, signal metrics, preference metrics
- Decision analytics: total decisions, average confidence, approval rate, override rate, recruiter trust score, top factors

#### 5. Override Learner (`override-learner.ts`)
- Records every recruiter override with full context (AI suggestion, human choice, reason, confidence snapshot)
- Generates override patterns: most overridden actions, common reasons, confidence at override
- Detects AI blind spots: systematic gaps where AI confidently suggests actions recruiters reject
- Feeds override events back as behavioral signals for adaptive learning

### Approval States System

| State | Meaning |
|-------|---------|
| `suggested` | AI recommends an action |
| `pending_approval` | Waiting for recruiter decision |
| `approved` | Human accepted the AI suggestion |
| `rejected` | Human denied with reason |
| `auto_executed` | Confidence above threshold, auto-trusted |

### Confidence Threshold Configuration

The automation threshold is stored per-employer in `recruiter_memory` (key: `auto_execution_threshold`).
- **95-99% (Conservative)**: Most actions require approval
- **85-94% (Balanced)**: High-confidence actions auto-execute
- **50-84% (Aggressive)**: Most actions auto-execute
- Configurable via the Observability dashboard slider

### API Endpoints Added (Phase 5B)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/agents/reasoning/record` | Record structured decision artifact |
| GET | `/agents/reasoning` | List reasoning logs |
| GET | `/agents/reasoning/target` | Get decisions for a target entity |
| GET | `/agents/reasoning/explain` | Explain a specific ranking decision |
| POST | `/agents/approvals/submit` | Submit action for approval |
| POST | `/agents/approvals/:id/approve` | Approve a pending action |
| POST | `/agents/approvals/:id/reject` | Reject with reason |
| GET | `/agents/approvals/pending` | List pending approvals + stats |
| GET | `/agents/approvals/history` | Full approval history |
| GET | `/agents/approvals/stats` | Approval statistics |
| GET | `/agents/approvals/threshold` | Get confidence threshold |
| POST | `/agents/approvals/threshold` | Set confidence threshold |
| GET | `/agents/overrides` | Override history + patterns |
| GET | `/agents/overrides/blind-spots` | Detected AI blind spots |
| GET | `/agents/safety/flags` | Safety flags + summary |
| POST | `/agents/safety/flags/:id/resolve` | Resolve a safety flag |
| GET | `/agents/observability/dashboard` | Full observability dashboard |
| GET | `/agents/observability/health` | Agent health metrics |
| GET | `/agents/observability/decisions` | Decision analytics |
| GET | `/agents/observability/metrics` | Raw agent metrics |

### Frontend: Observability Tab

New tab in employer dashboard with 5 sections:
1. **Agent Health Cards** — Active agents, AI decisions count, recruiter trust score, active safety flags
2. **Pending Approvals** — List of actions awaiting recruiter decision with approve/reject buttons and confidence badges
3. **Override Insights** — Most overridden actions, common rejection reasons, confidence at override stats, AI blind spot detection
4. **Safety Flags** — Active flags with severity indicators (critical/warning/info), type labels, and resolve actions
5. **Automation Threshold** — Slider to configure confidence-based auto-execution threshold (50-99%), with mode labels (Conservative/Balanced/Aggressive)
6. **Top Decision Factors** — Weighted list of factors influencing AI decisions, with frequency counts

### Key Strategic Insight

Phase 5B transforms the system from:
```
Powerful AI → Trusted AI Infrastructure
```

The difference is governance: explainability, auditability, intervention controls, and safety monitoring. This is what enterprise adoption depends on.

### What This Unlocks

- Recruiters can **trust** AI decisions because they're explainable
- Enterprises can **adopt** because they have override controls
- The system can **safely increase autonomy** as trust grows
- Override patterns become **reinforcement learning signals** for the adaptive intelligence layer
- Bias and drift are **detected early** before they impact hiring outcomes
