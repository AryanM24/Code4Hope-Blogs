/*
 * @file Site configuration
 */
import { defineConfig } from './src/helpers/config-helper';

export default defineConfig({
  lang: 'en-US',
  site: 'https://blogs.code4hope.net',
  avatar: '/avatar.png',
  title: 'Code4Hope Blogs',
  description: 'Stay updated on what we are doing at Code4Hope and all things tech-related.',
  lastModified: true,
  readTime: true,
  footer: {
    copyright: '© Code4Hope 2025',
  },
  socialLinks: [
    {
      icon: 'link',
      link: 'https://code4hope.net'
    },
]
});