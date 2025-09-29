# 🚀 AI Chat Frontend

Welcome to the most elegant chat interface you've ever seen! This Next.js application provides a beautiful, responsive chat interface that connects seamlessly with our FastAPI backend for AI-powered conversations.

## ✨ Features

- **Real-time Streaming**: Watch AI responses appear in real-time as they're generated
- **Persistent Chat History**: Your conversations are saved locally and restored when you return
- **Responsive Design**: Looks amazing on desktop, tablet, and mobile devices
- **Typing Indicators**: Visual feedback when the AI is thinking
- **Auto-scroll**: Always stay focused on the latest message
- **Settings Panel**: Easy configuration of API keys and system messages
- **Elegant UI**: Built with Tailwind CSS for a modern, clean aesthetic

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Local Storage** - Persistent chat history

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (we recommend using the latest LTS version)
- npm or yarn package manager
- An OpenAI API key

### Installation

1. **Clone and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

### 🔧 Configuration

1. **Set up your OpenAI API Key**:
   - Click the settings icon (⚙️) in the top-right corner
   - Enter your OpenAI API key
   - Optionally customize the system message
   - Click "Save Settings"

2. **Backend Connection**:
   - By default, the app connects to `http://localhost:8000`
   - Make sure your FastAPI backend is running on this port
   - To change the API URL, set the `NEXT_PUBLIC_API_URL` environment variable

### 📝 Environment Variables

Create a `.env.local` file in the frontend directory (optional):

```env
# API Backend URL (optional, defaults to http://localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 Usage

1. **Start a conversation**: Type your message in the input field at the bottom
2. **Send messages**: Press Enter or click the send button (📤)
3. **Multi-line messages**: Use Shift+Enter for line breaks
4. **Clear history**: Click the trash icon (🗑️) to clear all messages
5. **Adjust settings**: Click the gear icon (⚙️) to configure API key and system message

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat interface
│   ├── ChatMessage.tsx    # Individual message component
│   └── TypingIndicator.tsx # Typing animation
├── lib/                   # Utility functions
│   └── utils.ts          # Helper functions and storage utils
├── services/             # API services
│   └── chatApi.ts        # Backend communication
└── types/                # TypeScript type definitions
    └── chat.ts           # Chat-related types
```

## 🎨 Customization

The interface is built with Tailwind CSS, making it easy to customize:

- **Colors**: Modify the color scheme in `tailwind.config.js`
- **Fonts**: Update font families in `globals.css`
- **Components**: All components are in the `src/components` directory
- **Styling**: Use Tailwind utility classes for quick modifications

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🐛 Troubleshooting

**Common Issues:**

1. **"API key not set" error**: Make sure you've entered your OpenAI API key in settings
2. **Connection refused**: Ensure your FastAPI backend is running on port 8000
3. **Messages not loading**: Check browser console for errors and verify API connectivity
4. **Styling issues**: Clear browser cache and ensure Tailwind CSS is properly configured

**Development Tips:**

- Use browser DevTools to inspect network requests
- Check the console for any JavaScript errors
- Verify the backend is responding at `/api/health`

## 📱 Mobile Experience

The chat interface is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Optimized keyboard handling
- Responsive message bubbles
- Mobile-first design approach

## 🔒 Privacy & Security

- API keys are stored locally in your browser
- Chat history is saved in localStorage (client-side only)
- No data is sent to third parties except OpenAI for AI responses
- Clear your browser data to remove all stored information

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS. Ready to chat with AI in style! 🤖✨