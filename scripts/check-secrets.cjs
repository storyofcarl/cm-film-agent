const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env'));
const secrets = Object.entries(env).filter(([name, value]) => /KEY|TOKEN|PASSWORD|SECRET|DB_URL/.test(name) && !name.startsWith('NEXT_PUBLIC_') && value.length > 10);
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
let failures = 0;
for (const file of files) {
  if (file.startsWith('.env') && file !== '.env.example') { console.error('Environment file tracked:', file); failures++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  for (const [name, value] of secrets) if (text.includes(value)) { console.error('Configured secret found:', name, 'in', file); failures++; }
}
console.log('Checked', files.length, 'tracked files; secret matches:', failures);
process.exitCode = failures ? 1 : 0;
