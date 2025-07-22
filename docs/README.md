# QWERTY Internal Management System - Documentation

Welcome to the QWERTY Internal Management System documentation. This repository contains comprehensive documentation for our internal management platform built with Next.js, Supabase, and TypeScript.

## 📚 Documentation Index

### 🏗️ Architecture & Systems

- **[Client Creation System](./CLIENT_CREATION_SYSTEM.md)** - Complete guide to the automated client creation workflow
  - Database schema and relationships
  - Security considerations and best practices
  - API implementation and error handling
  - User workflows and troubleshooting

### 🔧 Development Guides

_Coming soon:_

- Database Schema Documentation
- API Reference
- Authentication & Authorization Guide
- Deployment Guide
- Contributing Guidelines

### 📋 Project Overview

The QWERTY Internal Management System is a role-based web application that provides:

- **Admin Portal**: Complete management interface for internal team members
- **Client Portal**: Dedicated interface for client access and communication
- **Automated Workflows**: Streamlined processes for client onboarding and management
- **Secure Authentication**: Role-based access control with Supabase Auth

### 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with role-based access
- **Database**: PostgreSQL with proper relationships and constraints
- **Deployment**: Vercel (recommended)

### 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd qwerty-internal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   - Admin: `http://localhost:3000/admin`
   - Client Portal: `http://localhost:3000/portal`
   - Sign In: `http://localhost:3000/signin`

### 📁 Project Structure

```
qwerty-internal/
├── docs/                          # 📚 Documentation
│   ├── README.md                  # This file
│   └── CLIENT_CREATION_SYSTEM.md  # Client creation documentation
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── admin/                 # Admin-specific pages
│   │   ├── portal/                # Client portal pages
│   │   ├── api/                   # API routes
│   │   └── signin/                # Authentication
│   ├── components/                # Reusable components
│   ├── utils/                     # Utility functions
│   └── types/                     # TypeScript type definitions
├── public/                        # Static assets
└── package.json                   # Dependencies and scripts
```

### 🔐 Environment Variables

Required environment variables for development:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 📊 Database Schema

The system uses three main tables:

1. **`auth.users`** - Supabase Auth users (managed by Supabase)
2. **`users`** - Custom user profiles with roles
3. **`clients`** - Client-specific information

For detailed schema information, see the [Client Creation System documentation](./CLIENT_CREATION_SYSTEM.md#database-schema).

### 🤝 Contributing

When contributing to this project:

1. **Read the relevant documentation** before making changes
2. **Follow the existing code style** and patterns
3. **Update documentation** when adding new features
4. **Test thoroughly** before submitting changes
5. **Use descriptive commit messages**

### 📞 Support

For questions or issues:

1. **Check the documentation** first
2. **Review existing issues** in the repository
3. **Create a new issue** with detailed information
4. **Contact the development team** for urgent matters

### 📄 License

This project is proprietary software developed for QWERTY internal use.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: QWERTY Development Team
