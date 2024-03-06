module.exports = {
  apps : [{
    name: 'twitchMiner',
    script: 'app.js',
    instances: 1,
    exec_mode  : "fork",
    watch: true,
    time: true,
  }],
};
