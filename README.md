# QWERTY Internal Management System

A comprehensive internal management platform built with Next.js, Supabase, and TypeScript. This system provides role-based access control with separate interfaces for administrators and clients.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Run development server
npm run dev
```

## 📚 Documentation

**📖 [View Full Documentation](./docs/README.md)**

Our comprehensive documentation includes:

- [Client Creation System](./docs/CLIENT_CREATION_SYSTEM.md) - Complete guide to automated client onboarding
- Architecture overview and database schema
- Security considerations and best practices
- Troubleshooting and debugging guides

## 🏗️ Features

- **🔐 Role-Based Authentication** - Secure admin and client portals
- **👥 Client Management** - Automated client account creation with password generation
- **📊 Dashboard Analytics** - Real-time insights and reporting
- **🔄 Real-time Updates** - Live data synchronization with Supabase
- **📱 Responsive Design** - Works seamlessly across all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with role-based access
- **Database**: PostgreSQL with proper relationships and constraints
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
qwerty-internal/
├── docs/                          # 📚 Documentation
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── admin/                 # Admin-specific pages
│   │   ├── portal/                # Client portal pages
│   │   ├── api/                   # API routes
│   │   └── signin/                # Authentication
│   ├── components/                # Reusable components
│   ├── utils/                     # Utility functions
│   └── types/                     # TypeScript type definitions
└── public/                        # Static assets
```

## 🔐 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🎯 Getting Started

1. **Clone the repository**
2. **Install dependencies** with `npm install`
3. **Set up environment variables** in `.env.local`
4. **Run the development server** with `npm run dev`
5. **Access the application**:
   - Admin: `http://localhost:3000/admin`
   - Client Portal: `http://localhost:3000/portal`
   - Sign In: `http://localhost:3000/signin`

## 📖 Learn More

- [Full Documentation](./docs/README.md) - Comprehensive guides and references
- [Client Creation System](./docs/CLIENT_CREATION_SYSTEM.md) - Detailed implementation guide
- [Supabase Documentation](https://supabase.com/docs) - Backend-as-a-Service platform
- [Next.js Documentation](https://nextjs.org/docs) - React framework

## 🤝 Contributing

Please read our [contributing guidelines](./docs/README.md#contributing) before submitting changes.

## 📄 License

This project is proprietary software developed for QWERTY internal use.

---

**Built with ❤️ by the QWERTY Development Team**
