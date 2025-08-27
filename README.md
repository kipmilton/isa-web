# ISA Web Application

A modern e-commerce platform built with React, TypeScript, and Supabase.

## Features

- **User Authentication**: Secure login and registration system
- **Vendor Management**: Complete vendor onboarding and dashboard
- **Product Management**: Add, edit, and manage products with images
- **Shopping Cart**: Full cart functionality with checkout
- **Order Management**: Track orders and delivery status
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Real-time Chat**: AI-powered customer support
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui
- **State Management**: React Context + Hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd isa-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── vendor/         # Vendor-specific components
│   └── ui/             # Base UI components (shadcn/ui)
├── pages/              # Page components
├── services/           # API and external service integrations
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── lib/                # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Deployment

The application can be deployed to any static hosting service:

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
