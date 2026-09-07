if (process.argv.includes('wait-for-signal')) {
  process.on('message', () => {})
  process.send('ready')
} else {
  process.exit(23)
}
