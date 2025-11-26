module.exports = {
  apps: [
    {
      name: 'webhook-proxy',
      script: 'server.js',
      cwd: '/root/Gemini-AI-Scraper',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'vite-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/root/Gemini-AI-Scraper',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
