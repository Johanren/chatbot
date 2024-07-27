module.exports = {
  apps : [{
    name: "whatsapp_externo",
    script: "./app.js",
    watch: false,
    max_memory_restart: '100M',
    cron_restart: '59 23 * * *',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
