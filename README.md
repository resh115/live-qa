# Live-QA

A real-time audience interaction platform built with **Next.js, Supabase, and Groq AI**. It lets a host or presenter collect questions and responses from an audience and provides several live interaction modes in one application.

## Features

- **Live Q&A** — audience members submit questions and upvote useful questions.
- **AI Answers** — questions can be sent to Groq AI for short, instant answers.
- **Polls** — audience members vote on predefined choices and see live percentages.
- **Live Ranking** — participants arrange options in their preferred order and submit their ranking.
- **Emoji Reactions** — live Like, Love, Laugh, and Fire reactions.
- **Word Cloud** — participants submit words or short phrases; frequent responses appear larger.
- **Quiz Mode** — multiple-choice questions with correct/incorrect feedback.
- **Live Rating** — participants rate a session from 1 to 5 and see the live average.
- **Supabase Realtime** — changes are reflected across connected clients without refreshing the page.
- **Responsive UI** — designed for desktop and mobile screens.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework and application routing |
| React 19 | User interface |
| TypeScript | Type-safe application code |
| Tailwind CSS 4 | Styling and responsive UI |
| Supabase | PostgreSQL database and realtime updates |
| Groq SDK | AI-powered question answering |
| PostgreSQL | Persistent application data |

## Project Structure

```text
live-qa/
├── app/
│   ├── api/
│   │   └── answer/
│   │       └── route.ts       # Groq AI API endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Application metadata/layout
│   └── page.tsx                 # Main Live-QA application
├── lib/
│   └── supabase.ts              # Supabase client
├── public/                      # Static assets
├── supabase/
│   └── schema.sql               # Database tables, policies and starter data
├── .env.local                   # Local environment variables (create this)
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## Prerequisites

Install the following before running the project:

- **Node.js 20+** recommended
- **npm**
- A **Supabase** project
- A **Groq API key** for AI answers

Check your Node.js and npm versions:

```bash
node -v
npm -v
```

## 1. Clone the Repository

```bash
git clone https://github.com/resh115/live-qa.git
cd live-qa
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Supabase

Create a project at [Supabase](https://supabase.com/).

Open:

```text
Supabase Dashboard
→ SQL Editor
→ New Query
```

First make sure your existing `questions` and `polls` tables are present, because the original application already uses them.

Then run:

```text
supabase/schema.sql
```

The schema creates the tables required by the new features:

```text
rankings
ranking_options
ranking_votes
reactions
word_cloud_entries
quizzes
quiz_options
quiz_responses
ratings
```

It also creates development/demo Row Level Security policies, enables Supabase Realtime for the new tables, and inserts starter ranking and quiz content.

### Important: Realtime

The application listens for PostgreSQL changes through Supabase Realtime. Make sure the new tables are included in the `supabase_realtime` publication.

If your Supabase project reports that a table is already part of the publication, do not add that table a second time.

## 4. Create Environment Variables

Create a file named:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

### Where to find the Supabase values

In Supabase:

```text
Project Settings
→ API
```

Use the project URL and the publishable/anon client key appropriate for your project.

### Where to get the Groq API key

Create an API key from the [Groq Console](https://console.groq.com/).

**Never commit `.env.local` or any API key to GitHub.**

## 5. Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For another device on the same network, start Next.js using the appropriate host option and open the displayed LAN address.

## 6. Production Build

Before deployment, verify that the project compiles successfully:

```bash
npm run build
```

Start the production build locally with:

```bash
npm run start
```

## How the Features Work

### Live Q&A

1. A participant enters a question.
2. The question is stored in the `questions` table.
3. Participants can upvote questions.
4. Questions are sorted by vote count.
5. The **Ask AI** button sends the question to `/api/answer`.
6. The server calls Groq and returns a short answer.

### Poll

Poll data is read from the existing `polls` table. Each option stores its vote count, and the UI calculates the percentage from the total number of votes.

### Live Ranking

The ranking feature uses three tables:

```text
rankings
    ↓
ranking_options
    ↓
ranking_votes
```

A participant arranges the options using the up/down controls and submits the resulting order. Each ranking submission is associated with a browser-generated participant ID.

### Emoji Reactions

Every reaction creates a row in `reactions`:

```text
participant_id
reaction
created_at
```

The application counts reactions and updates the totals through Supabase Realtime.

### Word Cloud

Participants submit a word or short phrase. The application normalizes responses to lowercase, counts repeated responses, and scales the displayed text according to frequency.

### Quiz Mode

Quiz questions and choices are stored in:

```text
quizzes
quiz_options
quiz_responses
```

The selected answer is compared with the `is_correct` value and the participant receives immediate feedback.

### Live Rating

Participants select a 1–5 star rating. The application stores one rating per browser participant and calculates the current average and response count.

## Database Overview

```text
questions       → Live audience questions
polls           → Poll question and vote counters

rankings        → Ranking activity
ranking_options → Ranking choices
ranking_votes   → Participant ranking submissions

reactions       → Emoji reaction events
word_cloud_entries → Audience word submissions

quizzes         → Quiz questions
quiz_options    → Quiz choices and correct answer
quiz_responses  → Participant quiz answers

ratings         → Session ratings
```

## Security Notes

The included `supabase/schema.sql` contains **public/demo RLS policies** so that the project can work quickly with the browser client.

For a production application, these policies should be tightened. Recommended improvements include:

- Supabase Authentication for participants and hosts.
- Session-specific access rules.
- Host-only permissions for creating or editing polls, quizzes, and rankings.
- Server-side validation for all user-generated content.
- Rate limiting for questions, reactions, votes, and submissions.
- Database functions/RPCs for atomic vote increments.
- Separate production policies instead of unrestricted public insert/update policies.

## Common Problems

### `supabase` environment variable error

Check that `.env.local` exists in the project root and contains:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Restart the development server after changing environment variables.

### AI answers do not work

Check:

```env
GROQ_API_KEY=...
```

Also verify that the key is valid and that the `/api/answer` endpoint is being reached.

### New features show no data

Run `supabase/schema.sql` in the correct Supabase project and verify that the new tables contain the starter records.

### Realtime updates are not appearing

Verify that the required tables are enabled for Supabase Realtime and that the browser is connected to the same Supabase project configured in `.env.local`.

### `npm run build` fails

Run:

```bash
npm install
npm run build
```

Read the first TypeScript/ESLint error in the terminal; later errors can be consequences of the first failure.

## Deployment

The application can be deployed to services that support Next.js, such as Vercel.

Configure the same environment variables in the deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
GROQ_API_KEY
```

Run the Supabase SQL migration before using the deployed application.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run lint
npm run lint

# Create production build
npm run build

# Start production server
npm run start
```

## Project Goal

Live-QA is designed as a lightweight real-time classroom, presentation, event, and meeting engagement platform. Instead of relying on separate tools for questions, polls, reactions, rankings, quizzes, and feedback, the application combines these interactions into one web application backed by Supabase Realtime.

## License

This project does not currently declare a separate open-source license. Add a `LICENSE` file if you intend to distribute the project under a specific license.
