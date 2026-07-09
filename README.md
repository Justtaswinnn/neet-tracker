# NEET 2027 Tracker

A beautiful, gamified, and real-time tracking application for students preparing for the NEET 2027 medical entrance exam. Built with a focus on clean aesthetics, it includes full syllabus tracking, daily streaks, an XP and ranking system, and competitive social features.

## 🎯 Features

- **Syllabus Tracking**: Track your progress across Physics, Chemistry, Botany, and Zoology. Mark Theory, Questions, and Revisions (T, Q, R) as complete.
- **Gamification**: Earn XP for completing tasks, maintain daily streaks, and watch your rank grow.
- **Social & Friends**: Add your friends using secure 6-character buddy codes with an explicit consent-based request system. 
- **Privacy-First Progress Timeline**: View a real-time, cumulative line graph of your progress compared to your friends. Your data is strictly protected by Row Level Security (RLS) and is only visible to accepted friends.
- **Real-time Chat**: Text your friends seamlessly within the app, complete with typing indicators and image attachments.
- **Clean Aesthetic**: A flat, minimalistic, and professional UI inspired by modern design principles.

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Animations**: canvas-confetti

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine
- A [Supabase](https://supabase.com/) account and project

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/neet-tracker.git
   cd neet-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

### Database Setup (Supabase)

To get the backend working, you need to execute the provided SQL scripts in your Supabase SQL Editor.

1. **Run Setup Scripts**: 
   Open your Supabase dashboard, go to the SQL Editor, and execute the contents of `supabase-setup.sql` to initialize the `profiles`, `progress`, and `xp` tables along with their RLS policies.
2. **Run Chat & Storage Setup**: 
   Execute the contents of `supabase-chat.sql` to initialize the messaging table, enable Realtime, and set up the public storage bucket for image attachments.
3. **Run Migrations (If updating from legacy system)**:
   If you used an older version of this app with the legacy 1-on-1 buddy system, run `supabase-migration.sql` to migrate to the new multi-friend architecture.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
