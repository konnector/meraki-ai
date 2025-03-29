# Meraki.ai - Modern Spreadsheet Application

## Overview
Meraki.ai is a modern web application built with Next.js 15, TypeScript, and a comprehensive set of UI components. The application features secure authentication with Clerk, database functionality through Supabase, and a powerful spreadsheet editor with formula support.

## Tech Stack
- **Framework:** Next.js 15.1.0
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Clerk (with JWT Templates)
- **Database:** Supabase with Row Level Security
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** React Context & Hooks
- **Form Handling:** React Hook Form with Zod validation
- **Additional Features:**
  - Theme support (next-themes)
  - Modern UI components (shadcn/ui)
  - Formula parsing and calculation
  - Real-time data saving
  - Undo/redo functionality
  - Cell range selection
  - Copy/paste with formula adjustments

## Features

### Core Features (✅ Completed)
- **Authentication & Security**
  - User sign-up/sign-in with Clerk
  - JWT template configuration
  - Session management
  - Protected routes
  - Row Level Security in Supabase

- **Spreadsheet Core**
  - Real-time data saving with debounce
  - Title editing with auto-save
  - Star/unstar functionality
  - Basic cell operations
  - Undo/redo support
  - Copy/paste functionality with formula adjustments
  - Cell range selection
  - Column/row selection
  - Keyboard navigation

- **Cell Formatting**
  - Bold, italic, underline
  - Text alignment (left, center, right)
  - Font family selection
  - Font size options
  - Text and background colors
  - Custom cell types (text, number)

- **Formula Support**
  - Basic arithmetic operations
  - SUM function with cell ranges
  - Formula dependency tracking
  - Error handling and display
  - Formula bar with editing
  - Cell reference validation
  - Formula reference adjustment during copy/paste

### Advanced Features (🟨 In Progress)
- **Enhanced Formula System**
  - Additional functions (AVG, COUNT, etc.)
  - Multi-sheet references
  - Custom function support
  - Improved formula reference handling

- **Data Validation**
  - Input validation rules
  - Custom cell types
  - Data format enforcement
  - Error messaging

- **Advanced UI Features**
  - Conditional formatting
  - Custom number formats
  - Cell merging
  - Frozen rows/columns

### Upcoming Features (⬜ Planned)
- **Collaboration**
  - Real-time multi-user editing
  - User presence indicators
  - Edit history tracking
  - Comments and annotations
  - Share permissions

- **AI Integration**
  - Formula suggestions
  - Data analysis
  - Pattern recognition
  - Natural language queries
  - Smart formatting

- **Enhanced Grid Features**
  - Cell merging
  - Auto-fill
  - Custom cell validation
  - Advanced sorting and filtering
  - Cell protection
  - Custom cell renderers

## Project Structure
```
├── app/                  # Next.js app directory
│   ├── dashboard/       # Dashboard pages
│   ├── spreadsheet/    # Spreadsheet editor
│   ├── settings/       # User settings
│   └── auth/          # Authentication pages
├── components/          # React components
│   ├── SpreadSheet/    # Spreadsheet components
│   │   ├── Cell.tsx   # Cell component
│   │   ├── Grid.tsx   # Grid layout
│   │   └── Toolbar.tsx # Formatting tools
│   └── ui/            # Common UI components
├── context/            # React contexts
│   └── spreadsheet/   # Spreadsheet state
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
│   ├── spreadsheet/  # Spreadsheet logic
│   │   ├── FormulaParser.ts
│   │   └── DependencyGraph.ts
│   └── supabase/    # Database integration
└── types/            # TypeScript definitions
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Set up Supabase:
   - Create JWT template in Clerk Dashboard
   - Configure database tables and RLS policies
   - Set up realtime subscriptions

5. Run the development server:
   ```bash
   pnpm dev
   ```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error handling
- Write clean, maintainable code
- Add JSDoc comments for complex functions

### Performance Optimization
- Implement proper memoization
- Use virtualization for large datasets
- Optimize formula calculations
- Implement efficient caching
- Monitor and optimize re-renders

### Testing
- Write unit tests for core functionality
- Add integration tests for features
- Implement end-to-end testing
- Performance testing for large sheets
- Security testing for authentication

### Mobile Support
- Implement responsive design
- Add touch interactions
- Optimize for mobile performance
- Add mobile-specific features

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Your license information here]

## Acknowledgments
- Next.js team for the framework
- Clerk for authentication
- Supabase for database
- shadcn/ui for components
- All contributors
