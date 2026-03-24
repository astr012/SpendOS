# SpendOS — Dark Expense Tracker

A dark-themed personal expense tracker built with Next.js, Firebase Auth, and Firestore.

## Features

- Anonymous Firebase authentication
- Real-time expense sync via Firestore
- Category-based expense logging
- Live net outflow total
- Virtualized list for large datasets

## Stack

- Next.js 16 (App Router)
- TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS
- TanStack Virtual
- Vitest + fast-check

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the env example and fill in your Firebase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
4. Enable **Anonymous Authentication** in your Firebase Console → Authentication → Sign-in method
5. Run the dev server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_APP_ID=        # optional, scopes Firestore data
```

## Tests

```bash
npm test
```
