# GitHub Copilot Context - AjudaDeBerco

## Project Overview
**AjudaDeBerco** is a Next.js application designed to provide assistance and support services. This project aims to create a modern, responsive web application that helps users with various support needs.

## Technology Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm
- **Development**: Hot reload with Fast Refresh

## Project Structure
```
AjudaDeBerco/
├── src/                    # Source code directory
│   ├── app/               # App Router pages and layouts
│   │   ├── layout.tsx     # Root layout component
│   │   ├── page.tsx       # Home page
│   │   └── globals.css    # Global styles
│   ├── components/        # Reusable React components
│   └── lib/              # Utility functions and configurations
├── public/               # Static assets (images, icons, etc.)
├── .git/                # Git repository
├── .gitignore           # Git ignore rules
├── next.config.ts       # Next.js configuration
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── postcss.config.mjs   # PostCSS configuration
└── eslint.config.mjs    # ESLint configuration
```

## Development Guidelines

### Code Style
- Use TypeScript for all components and utilities
- Follow React functional components with hooks
- Use Tailwind CSS for styling
- Implement responsive design principles
- Follow Next.js App Router conventions

### Component Naming
- Use PascalCase for component names
- Use kebab-case for file names when appropriate
- Keep component files in `src/components/` directory
- Use descriptive names that indicate component purpose

### File Organization
- Pages go in `src/app/` following App Router structure
- Reusable components in `src/components/`
- Utilities and helpers in `src/lib/`
- Static assets in `public/`
- Types and interfaces should be defined close to usage or in dedicated type files

### Styling Conventions
- Use Tailwind CSS utility classes
- Create custom components for repeated patterns
- Follow mobile-first responsive design
- Use CSS custom properties for theme values when needed

## Key Features to Implement
- Responsive navigation
- User-friendly interface
- Accessibility compliance
- SEO optimization
- Performance optimization
- Modern design patterns

## Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Setup
- Node.js version 18+ required
- Development server runs on http://localhost:3000
- Hot reload enabled for development

## Best Practices
1. **Performance**: Optimize images, use Next.js Image component
2. **SEO**: Implement proper meta tags, structured data
3. **Accessibility**: Follow WCAG guidelines, semantic HTML
4. **Security**: Validate inputs, sanitize data
5. **Testing**: Write unit tests for components and utilities
6. **Documentation**: Comment complex logic, maintain README

## Common Patterns
- Use `use client` directive for client-side interactivity
- Implement Server Components by default
- Use TypeScript interfaces for props and data structures
- Handle loading and error states appropriately
- Implement proper error boundaries

## Integration Notes
- This project may integrate with backend services
- Consider API routes for server-side functionality
- Plan for database integration if needed
- Implement proper authentication if user management is required

## Deployment Considerations
- Optimize for production builds
- Configure proper environment variables
- Set up CI/CD pipelines
- Consider CDN for static assets
- Plan for monitoring and analytics

---

*This context file helps GitHub Copilot understand the project structure, conventions, and goals to provide more accurate and relevant code suggestions.*