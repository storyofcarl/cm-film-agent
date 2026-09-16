const fs = require('node:fs');
async function main() {
  const team = process.env.VERCEL_ORG_ID;
  const headers = { Authorization: 'Bearer ' + process.env.VERCEL_TOKEN, 'Content-Type': 'application/json' };
  const name = 'cm-film-agent';
  let response = await fetch('https://api.vercel.com/v9/projects/' + name + '?teamId=' + team, { headers });
  if (response.status === 404) response = await fetch('https://api.vercel.com/v11/projects?teamId=' + team, {
    method: 'POST', headers, body: JSON.stringify({ name, framework: 'nextjs', buildCommand: 'npm run build', installCommand: 'ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci', publicSource: false }),
  });
  const project = await response.json();
  if (!response.ok) throw new Error('Vercel project setup failed: ' + (project.error?.code || response.status));
  fs.mkdirSync('.vercel', { recursive: true });
  fs.writeFileSync('.vercel/project.json', JSON.stringify({ projectId: project.id, orgId: team, projectName: name }, null, 2));
  console.log('Vercel project ready:', name, project.id);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
