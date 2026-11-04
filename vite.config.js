const react = require('@vitejs/plugin-react');

module.exports = {
  plugins: [react.default()],
  root: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
}
