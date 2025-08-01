# Ticket Management System

A modern ticket management system built with Next.js, React Query, and Clerk authentication. This application provides a role-based workflow for ticket creation, assignment, and management.

![Ticket Management System](https://placehold.co/600x400?text=Ticket+Management+System)

## Features

- **Role-Based Access Control**: Three distinct roles (User, Moderator, Admin) with appropriate permissions
- **Ticket Workflow**: 
  - Users create and track tickets
  - Moderators are assigned tickets to resolve
  - Admins oversee the entire system and manage roles
- **Real-Time Updates**: Automatic data refreshing when returning to the application
- **Optimized Data Fetching**: Smart caching with user-scoped isolation
- **Modern UI**: Built with Geist Sans and Mono fonts for a clean, professional look
- **Responsive Notifications**: Toast notifications for important events

## Technology Stack

- **Frontend**: Next.js with App Router
- **Data Fetching**: TanStack React Query (v5)
- **Authentication**: Clerk
- **UI Components**: Custom styling with CSS modules
- **Notifications**: Sonner toast library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ticket-management-system.git
cd ticket-management-system
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
# Add other required environment variables
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Architecture

### React Query Configuration

The application uses a custom React Query configuration for optimal performance:

- **User-Scoped Caching**: Query cache is isolated per user to prevent data leakage
- **Retry Strategy**: Failed queries are retried once for improved reliability
- **Dynamic Stale Times**: Data is considered stale after 30 seconds for dynamic routes
- **Development Tools**: React Query DevTools are available in development mode

```javascript
// Simplified example of our React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      queryKeyHashFn: (queryKey) => hashKey([{ userId }, ...queryKey]),
    },
  },
});
```

### Role-Based Workflow

1. **User Flow**:
   - Create new tickets
   - View and track their own tickets
   - Receive updates on ticket status

2. **Moderator Flow**:
   - Receive assigned tickets
   - Process and resolve tickets
   - Communicate with users

3. **Admin Flow**:
   - Overview of all tickets in the system
   - Assign tickets to moderators
   - Manage user roles and permissions
   - Access to system analytics

## Configuration Options

The application offers several configuration options in `next.config.js`:

```javascript
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30  // Time in seconds before data is considered stale
    }
  },
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [TanStack Query](https://tanstack.com/query)
- [Clerk](https://clerk.dev/)
- [Sonner](https://sonner.emilkowal.ski/)