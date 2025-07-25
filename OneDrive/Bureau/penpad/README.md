# PenPad - AI-Powered Writing Assistant

A comprehensive writing app with AI assistance, grammar checking, and real-time collaboration built with Next.js, TypeScript, and Tiptap.

## Features

### ✨ Core Features
- **Rich Text Editor**: Full-featured editor with Tiptap
- **AI Writing Assistant**: Intelligent suggestions and content generation
- **Grammar & Spell Checking**: Multi-language support with real-time checking
- **Real-time Collaboration**: Live cursors and instant updates
- **Document Management**: Create, edit, and organize documents
- **Auto-save**: Automatic document saving every 2 seconds

### 🎨 Text Formatting
- Bold, Italic, Underline, Strikethrough
- Font family, size, and color selection
- Text alignment (left, center, right, justify)
- Text highlighting
- Headings (H1-H6)
- Bullet and numbered lists
- Blockquotes
- Code blocks with syntax highlighting
- Tables with formatting
- Images with resizing
- Links with validation
- Task lists

### 🤖 AI Integration
- Grammar and spell checking
- Writing style improvements
- Content generation
- Translation assistance
- Plagiarism detection

### 💎 Premium Features
- Unlimited documents
- Advanced grammar checking
- All fonts and styling options
- AI writing assistance
- Unlimited word count
- All export formats (PDF, DOCX, HTML)
- Real-time collaboration
- Advanced analytics
- Custom themes
- Priority support

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Editor**: Tiptap with extensive extensions
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Payments**: Stripe
- **AI**: OpenAI API
- **Grammar**: Nspell with multiple language dictionaries

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- OpenAI API key
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd penpad
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── RichTextEditor.tsx    # Main editor component
│   │   ├── Toolbar.tsx           # Editor toolbar
│   │   ├── AIBubbleMenu.tsx      # AI suggestions menu
│   │   ├── ContextMenu.tsx       # Right-click context menu
│   │   ├── PaywallModal.tsx      # Premium upgrade modal
│   │   ├── ProgressTracker.tsx   # Writing progress
│   │   ├── GoalTrackerModal.tsx  # Writing goals
│   │   ├── NotesView.tsx         # Notes sidebar
│   │   ├── QuickSuggestionBar.tsx # Quick AI suggestions
│   │   ├── WriterToolkit.tsx     # Writing tools
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useEditor.ts          # Editor state hook
│   │   └── useGrammar.ts         # Grammar checking hook
│   ├── store/
│   │   ├── useUserStore.ts       # User state management
│   │   ├── useEditorStore.ts     # Editor state management
│   │   └── useSettingsStore.ts   # Settings state management
│   ├── lib/
│   │   ├── firebase.ts           # Firebase client config
│   │   ├── firebase-admin.ts     # Firebase admin config
│   │   ├── stripe.ts             # Stripe configuration
│   │   └── utils.ts              # Utility functions
│   ├── api/
│   │   ├── ai/generate/route.ts  # AI content generation
│   │   ├── grammar/route.ts      # Grammar checking
│   │   ├── create-checkout-session/route.ts # Stripe checkout
│   │   ├── stripe-webhook/route.ts # Stripe webhooks
│   │   └── update-premium/route.ts # Premium status update
│   ├── auth/
│   │   ├── signin/page.tsx       # Sign in page
│   │   └── signup/page.tsx       # Sign up page
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── settings/page.tsx         # User settings
│   └── layout.tsx                # Root layout
├── extensions/
│   ├── CustomHighlight.ts        # Custom highlighting
│   ├── FontSize.ts               # Font size extension
│   ├── Grammar.ts                # Grammar checking
│   └── AIAssistant.ts            # AI assistance
└── types/
    └── index.ts                  # TypeScript definitions
```

## User Isolation & Multi-Sync

### Per-User Storage
- Each user gets their own localStorage key: `penpad_user_{email}`
- Zustand stores with per-user persistence
- Dynamic key per user for data isolation

### Firebase Data Structure
```
users/{userId}/
├── profile/
│   ├── email: string
│   ├── displayName: string
│   ├── isPremium: boolean
│   └── createdAt: timestamp
├── documents/
│   ├── {docId}/
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── lastModified: timestamp
│   │   └── metadata: object
├── settings/
│   ├── fontSize: number
│   ├── theme: string
│   ├── language: string
│   └── preferences: object
└── analytics/
    ├── wordsWritten: number
    ├── timeSpent: number
    └── goals: object
```

### Real-time Sync Features
- **Document Auto-save**: Every 2 seconds
- **Conflict Resolution**: Last-write-wins with timestamps
- **Offline Support**: Local storage + sync when online
- **Multi-device Sync**: Real-time updates across devices
- **Version History**: Keep last 10 versions of each document

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus indicators
- ARIA labels
- Semantic HTML

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, email support@penpad.com or create an issue in the repository. 