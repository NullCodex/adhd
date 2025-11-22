# ADHD Web Application

A modern web application built with Next.js, TypeScript, and Tailwind CSS.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
adhd/
├── app/                 # Next.js App Router directory
│   ├── layout.tsx      # Root layout component
│   ├── page.tsx        # Homepage
│   └── globals.css     # Global styles with Tailwind
├── components/         # Reusable React components (create as needed)
├── public/            # Static assets (create as needed)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── next.config.js      # Next.js configuration
```

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

## Deployment to GitHub Pages

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages in your repository:**
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"

2. **Configure base path (if needed):**
   - If your repository name is NOT `username.github.io` (i.e., it's a project repository), you need to set a base path
   - Open `next.config.js` and uncomment the `basePath` line:
     ```javascript
     basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
     trailingSlash: true,
     ```
   - Replace `'/your-repo-name'` with your actual repository name

3. **Push to main branch:**
   - The GitHub Actions workflow will automatically build and deploy your site
   - After deployment, your site will be available at:
     - `https://username.github.io/your-repo-name/` (if using basePath)
     - `https://username.github.io/` (if repository is `username.github.io`)

### Manual Build

To test the static export locally:

```bash
npm run export
```

The static files will be generated in the `out` directory.

## Next Steps

- Add new pages by creating files in the `app` directory
- Create reusable components in a `components` directory
- Add API routes in `app/api` if needed (Note: API routes won't work with static export)
- Customize styling in `tailwind.config.ts`

