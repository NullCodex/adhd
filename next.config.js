const withNextIntl = require('next-intl/plugin')(
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // If your repository name is not 'username.github.io', uncomment and set the basePath
  basePath: process.env.NODE_ENV === 'production' ? '/adhd' : '',
  // trailingSlash: true,
}

// Only use static export for production builds (dev server doesn't work well with it)
if (process.env.NODE_ENV === 'production') {
  nextConfig.output = 'export';
}

module.exports = withNextIntl(nextConfig)

