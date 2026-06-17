module.exports = {
  apps: [
    {
      name: 'room-booking',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/room-booking',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
}
