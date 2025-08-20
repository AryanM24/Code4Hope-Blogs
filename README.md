# Code4Hope Blogs - Article Creation Guide

This comprehensive guide explains exactly how to create new articles for the Code4Hope Blogs system built with Astro.

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Article Structure](#article-structure)
4. [Creating New Articles](#creating-new-articles)
5. [Content Schema Requirements](#content-schema-requirements)
6. [Supported Features](#supported-features)
7. [Development Workflow](#development-workflow)
8. [Best Practices](#best-practices)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## System Overview

The Code4Hope Blogs system is built using:

- **Astro** (v5.2.5) - Static site generator and framework
- **Tailwind CSS** (v4.0.3) - Styling framework
- **MDX** - Enhanced Markdown with React components
- **TypeScript** - Type safety and development experience
- **React** - Interactive components

The blog uses Astro's content collection system to manage articles, with automated features like reading time calculation and last modified tracking.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
2. **npm** or **pnpm** (pnpm is preferred based on the lock file)
3. **Git** for version control

### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/AryanM24/Code4Hope-Blogs.git
cd Code4Hope-Blogs

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

The development server will start at `http://localhost:4321`

## Article Structure

### Directory Layout

All articles are stored in the `src/content/post/` directory:

```
src/
├── content/
│   ├── config.ts          # Content collection schema
│   └── post/              # Article directory
│       ├── article1.md
│       ├── article2.md
│       └── ...
├── pages/
│   └── blog/
│       └── [...slug].astro # Dynamic article page template
└── ...
```

### File Naming Convention

- Use kebab-case (lowercase with hyphens)
- Use descriptive names that reflect the article content
- Examples: `iran-israel-conflict.md`, `c4hjunerecap.md`, `wwdc25-highlights.md`

## Creating New Articles

### Method 1: Manual Creation

1. **Create a new `.md` or `.mdx` file** in `src/content/post/`

2. **Add the frontmatter** (YAML header between `---`)

3. **Write your content** in Markdown

### Method 2: Using Obsidian Template (Recommended)

The repository includes an Obsidian template for consistent article creation:

1. **Set up Obsidian** (if using):
   - Set `Obsidian Template/` as your template folder
   - Use `Preferences → Templates → Template Folder Location`

2. **Use the template** from `Obsidian Template/Blog Post.md`:

```markdown
---
title: 
description: 
tags: 
pubDate: 
draft: false
---
```

### Step-by-Step Article Creation

1. **Create the file**:
   ```bash
   touch src/content/post/your-article-name.md
   ```

2. **Add frontmatter**:
   ```markdown
   ---
   title: Your Article Title
   description: A brief description of your article content for SEO and previews
   tags:
     - Technology
     - Code4Hope
     - Tutorial
   pubDate: 2025-01-20
   draft: false
   ---
   ```

3. **Add your content**:
   ```markdown
   # Your Main Heading
   
   Your article content goes here in Markdown format.
   
   ## Subheading
   
   More content...
   
   ![Image Alt Text](/image-name.jpg)
   
   Love,
   The Code4Hope Team
   ```

## Content Schema Requirements

The content schema is defined in `src/content/config.ts`. Here are the requirements:

### Required Fields

- **`title`** (string): The article title
- **`pubDate`** (date): Publication date (required when `draft: false`)

### Optional Fields

- **`description`** (string): Article description for SEO and previews
- **`tags`** (array of strings): Categorization tags
- **`draft`** (boolean): Set to `true` for unpublished articles (default: `false`)

### Field Examples

```yaml
---
# Required
title: "Tech and the Iran–Israel Proxy Conflict"
pubDate: 2025-06-30

# Optional but recommended
description: "The Iran–Israel proxy conflict has become a test for the potential power of advanced military and cyber technologies..."
tags:
  - Tech News
  - Cyber tech
  - Geopolitics

# Optional
draft: false  # Set to true to hide from production builds
---
```

### Date Format

Use ISO date format: `YYYY-MM-DD`

Examples:
- `pubDate: 2025-01-20`
- `pubDate: 2025-12-31`

## Supported Features

### 1. **Markdown Enhancements**

The system supports extended Markdown through remark plugins:

- **Emoji**: Use GitHub emoji syntax `:smile:` 😄
- **Math**: LaTeX math expressions with `$` and `$$`
- **Code imports**: Import code from external files
- **Block containers**: Special callout boxes
- **Figures**: Automatic figure captions

### 2. **Code Blocks**

Enhanced code blocks with syntax highlighting:

````markdown
```javascript
function hello() {
  console.log("Hello, Code4Hope!");
}
```
````

### 3. **Images**

Place images in the `public/` directory and reference them:

```markdown
![Image description](/image-name.jpg)
```

The system automatically handles:
- Figure captions
- Responsive images
- Optimization

### 4. **Automatic Features**

- **Reading time**: Automatically calculated and displayed
- **Last modified**: Tracked via Git commits
- **Table of contents**: Generated from headings
- **SEO metadata**: Generated from frontmatter

## Development Workflow

### 1. **Development Mode**

```bash
npm run dev
```

- Shows draft articles
- Hot reloading
- Development optimizations

### 2. **Building for Production**

```bash
npm run build
```

- Hides draft articles
- Optimizes assets
- Generates static files

### 3. **Preview Production Build**

```bash
npm run preview
```

### 4. **Linting and Formatting**

```bash
# Type checking
npm run tsc

# Linting
npm run lint

# Formatting
npm run format
```

## Best Practices

### Content Guidelines

1. **Clear titles**: Use descriptive, SEO-friendly titles
2. **Descriptions**: Write compelling descriptions (150-160 characters)
3. **Tags**: Use relevant, consistent tags for categorization
4. **Structure**: Use proper heading hierarchy (H1 → H2 → H3)
5. **Images**: Include alt text for accessibility

### Technical Best Practices

1. **File naming**: Use kebab-case for file names
2. **Image optimization**: Use appropriate image formats and sizes
3. **SEO**: Include descriptions and relevant tags
4. **Testing**: Preview articles in development mode
5. **Git**: Use meaningful commit messages

### Content Structure Recommendations

```markdown
---
title: Descriptive Title
description: Compelling 1-2 sentence description
tags:
  - Category1
  - Category2
  - Specific Topic
pubDate: YYYY-MM-DD
---

![Header Image](/header-image.jpg)

Opening paragraph that hooks the reader and sets context.

## Main Content Section

Detailed content with proper headings, paragraphs, and formatting.

### Subsection

More specific details.

## Conclusion

Wrap up the article with key takeaways.

Love,
The Code4Hope Team

Article written by [Author Name] (if applicable)
```

## Deployment

The blog is configured to deploy to `https://blogs.code4hope.net` (as set in `slate.config.ts`).

### Automated Deployment

The repository includes:
- **Husky**: Git hooks for quality checks
- **Commitlint**: Standardized commit messages
- **ESLint**: Code quality checks
- **Prettier**: Code formatting

### Manual Deployment Steps

1. **Build the site**:
   ```bash
   npm run build
   ```

2. **Test the build**:
   ```bash
   npm run preview
   ```

3. **Deploy** (depends on your hosting setup):
   - Static files are in `dist/` directory
   - Upload to your hosting provider
   - Configure domain and SSL

## Troubleshooting

### Common Issues

1. **Article not showing up**:
   - Check if `draft: true` is set
   - Verify the file is in `src/content/post/`
   - Ensure frontmatter is valid YAML

2. **Build errors**:
   - Run `npm run tsc` to check TypeScript errors
   - Verify all required frontmatter fields are present
   - Check for invalid Markdown syntax

3. **Images not displaying**:
   - Ensure images are in the `public/` directory
   - Use absolute paths starting with `/`
   - Check file names and extensions

4. **Date format issues**:
   - Use ISO format: `YYYY-MM-DD`
   - Don't include time information
   - Ensure the date is valid

### Validation Commands

```bash
# Check TypeScript
npm run tsc

# Lint and check
npm run lint

# Build and test
npm run build
npm run preview
```

### Debug Mode

For detailed debugging, you can:

1. Check the Astro dev server logs
2. Inspect the generated content collection
3. Use browser dev tools for runtime issues
4. Check the `dist/` directory after building

## Additional Resources

- **Astro Documentation**: [https://docs.astro.build/](https://docs.astro.build/)
- **Astro Content Collections**: [https://docs.astro.build/en/guides/content-collections/](https://docs.astro.build/en/guides/content-collections/)
- **Markdown Guide**: [https://www.markdownguide.org/](https://www.markdownguide.org/)
- **MDX Documentation**: [https://mdxjs.com/](https://mdxjs.com/)

## Configuration Files Reference

### Key Configuration Files

- **`slate.config.ts`**: Site configuration (title, description, social links)
- **`astro.config.mjs`**: Astro framework configuration
- **`src/content/config.ts`**: Content schema definition
- **`package.json`**: Dependencies and scripts
- **`tsconfig.json`**: TypeScript configuration

### Modifying Site Settings

Edit `slate.config.ts` to change:
- Site title and description
- Social media links
- Footer information
- Feature toggles (reading time, last modified)

---

This guide provides everything you need to create and manage articles for the Code4Hope Blogs system. For questions or issues, refer to the troubleshooting section or consult the Astro documentation.
