# Elk Peak Consulting Website

A modern website and metrics dashboard for Elk Peak Consulting, featuring tech services information and a password-protected metrics tracking system.

## Features

- **Main Website**: Public-facing pages showcasing services, about, and contact information
- **Metrics Dashboard**: Password-protected dashboard tracking metrics across multiple businesses:
  - Elk Peak Consulting
  - Life Organizer Guru
  - The Friendly Tech Help
  - Runtime PM
- **Quarterly Goals**: Track and manage quarterly goals with progress visualization
- **Multi-Business Tracking**: Comprehensive metrics for each business unit

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up Supabase:
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL Editor
   - Deploy the edge function from `supabase/functions/admin-auth/` to Supabase
   - Set environment variables for the edge function:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `ALLOWED_DOMAINS`: Comma-separated list of allowed domains (optional)

4. Create an admin password:
   - Insert a password into the `admin_password` table:
   ```sql
   INSERT INTO admin_password (password, is_admin, name)
   VALUES ('your_secure_password', true, 'Admin User');
   ```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
elk-peak/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout with navigation
│   │   ├── PasswordGate.jsx    # Password protection component
│   │   └── MetricsDashboard.jsx # Metrics dashboard
│   ├── pages/
│   │   ├── Home.jsx            # Homepage
│   │   ├── Services.jsx        # Services page
│   │   ├── About.jsx           # About page
│   │   └── Contact.jsx         # Contact page
│   ├── services/
│   │   └── api.js              # API service functions
│   ├── lib/
│   │   └── supabase.js        # Supabase client
│   └── catalyst/               # UI component library
├── supabase/
│   ├── schema.sql              # Database schema
│   └── functions/
│       └── admin-auth/         # Authentication edge function
└── package.json
```

## Routes

- `/` - Homepage
- `/services` - Services overview
- `/about` - About page
- `/contact` - Contact form
- `/metrics` - Password-protected metrics dashboard

## Metrics Tracked

### Elk Peak Consulting
- Active Clients
- Monthly Recurring Revenue (MRR)
- Total Revenue
- Total Projects

### Life Organizer Guru
- Total Revenue (KDP + Notion)
- KDP Revenue
- Notion Templates Revenue
- Active Runtime PM Users

### The Friendly Tech Help
- Total Revenue
- Active HOA Clients
- Total Tech Days

### Runtime PM
- Active Users
- Monthly Recurring Revenue (MRR)
- Active Subscriptions

## Styling

The website uses Tailwind CSS with a modern, tech-focused design inspired by Life Organizer Guru but with a more technical aesthetic. The design is clean, professional, and accessible.

## License

Private - All rights reserved

# elk-peak
