/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If your repository name is not 'username.github.io', uncomment and set the basePath
  basePath: process.env.NODE_ENV === 'production' ? '/adhd' : '',
  // trailingSlash: true,
}

module.exports = nextConfig

