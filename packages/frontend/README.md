# EdgeCharge Frontend

A modern, responsive Next.js frontend for the EdgeCharge DePIN billing platform, built with shadcn/ui components and Tailwind CSS.

## Features

### 🏢 Enterprise Dashboard
- **Project Overview**: Monitor usage and costs across all projects
- **Usage Analytics**: Real-time usage patterns and trends
- **Invoice Management**: View, download, and track invoice status
- **Cost Tracking**: Detailed cost breakdown and billing analytics

### 🖥️ Provider Dashboard
- **Usage Anchors**: Monitor all usage anchors submitted to the blockchain
- **Invoice Status**: Track invoice hashes and their blockchain status
- **Earnings Analytics**: Revenue analysis and payment tracking
- **Dispute Management**: Handle and monitor dispute cases

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Real-time Updates**: Live data updates and notifications
- **Accessibility**: WCAG compliant components

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Charts**: Recharts (ready for integration)
- **Blockchain**: Viem and Wagmi (ready for Web3 integration)
- **State Management**: React Query (ready for API integration)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
packages/frontend/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── enterprise/           # Enterprise API endpoints
│   │   ├── provider/             # Provider API endpoints
│   │   └── invoices/             # Invoice management APIs
│   ├── enterprise/               # Enterprise dashboard pages
│   ├── provider/                 # Provider dashboard pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   └── layout/                   # Layout components
├── lib/                          # Utility functions
└── public/                       # Static assets
```

## Key Components

### Layout Components
- **Sidebar**: Navigation sidebar with dashboard links
- **Header**: Top navigation with search, theme toggle, and user actions

### UI Components
- **Card**: Content containers with consistent styling
- **Table**: Data tables with sorting and filtering
- **Button**: Interactive buttons with multiple variants
- **Badge**: Status indicators and labels
- **Tabs**: Tabbed content organization

### Dashboard Features
- **Real-time Stats**: Live metrics and KPIs
- **Data Tables**: Sortable and filterable data views
- **Download Actions**: PDF invoice downloads
- **Blockchain Integration**: Transaction links and hash displays

## API Integration

The frontend includes API routes that connect to the EdgeCharge backend services:

### Enterprise APIs
- `GET /api/enterprise/projects` - Fetch project data
- `GET /api/enterprise/invoices` - Fetch invoice data

### Provider APIs
- `GET /api/provider/anchors` - Fetch usage anchors
- `GET /api/provider/invoices` - Fetch provider invoices

### Invoice APIs
- `GET /api/invoices/[id]/download` - Download invoice PDFs

## Customization

### Theme Configuration
The application uses CSS variables for theming. Customize colors in `app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... other variables */
}
```

### Component Styling
All components use Tailwind CSS classes and can be customized by modifying the component files or extending the Tailwind configuration.

## Integration with EdgeCharge Services

### Blockchain Integration
The frontend is ready to integrate with:
- **EdgeCharge Contract**: For reading usage anchors and invoice data
- **Provider Service**: For real-time usage data
- **Invoicing Service**: For invoice generation and management
- **Relayer Service**: For transaction monitoring

### Web3 Integration
Ready for Web3 integration with:
- **Wallet Connection**: Connect user wallets
- **Transaction Signing**: Sign and submit transactions
- **Event Listening**: Listen to blockchain events
- **Account Management**: Manage user accounts and permissions

## Development

### Adding New Pages
1. Create a new directory in `app/`
2. Add a `page.tsx` file
3. Update the sidebar navigation in `components/layout/sidebar.tsx`

### Adding New Components
1. Create component files in `components/`
2. Use shadcn/ui components as base
3. Follow the established patterns for styling and structure

### API Development
1. Add new API routes in `app/api/`
2. Follow RESTful conventions
3. Include proper error handling and validation

## Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Docker containers**

### Environment Variables
Set the following environment variables for production:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://...
NEXT_PUBLIC_EXPLORER_URL=https://...
```

## Contributing

1. Follow the established code patterns
2. Use TypeScript for type safety
3. Write responsive, accessible components
4. Test on multiple screen sizes
5. Follow the design system guidelines

## License

This project is part of the EdgeCharge platform and follows the same licensing terms.