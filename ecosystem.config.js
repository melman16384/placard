module.exports = {
  apps: [
    {
      name: 'placard',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/room-booking',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
}
