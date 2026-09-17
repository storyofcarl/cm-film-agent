const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env'));
const secrets = Object.entries(env).filter(([name, value]) => /KEY|TOKEN|PASSWORD|SECRET|DB_URL/.test(name) && !name.startsWith('NEXT_PUBLIC_') && value.length > 10);
const files = [...new Set(execFileSync('git', ['-c', 'safe.directory=' + process.cwd().replaceAll('\\', '/'), 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter((file) => file && fs.existsSync(file)))];
if (process.argv.includes('--studio-bundle')) {
  const path = require('node:path');
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  if (!fs.existsSync('apps/studio/.next/static')) throw new Error('Build Studio before scanning its browser bundle.');
  files.push(...walk('apps/studio/.next/static'));
}
let failures = 0;
for (const file of files) {
  if (file.startsWith('.env') && file !== '.env.example') { console.error('Environment file tracked:', file); failures++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  for (const [name, value] of secrets) if (text.includes(value)) { console.error('Configured secret found:', name, 'in', file); failures++; }
}
console.log('Checked', files.length, 'tracked and non-ignored source files; secret matches:', failures);
process.exitCode = failures ? 1 : 0;
