import next from 'eslint-config-next';

export default [
  ...next,
  { ignores: ['.next/**', 'node_modules/**', '.local/**', 'artifacts/**', 'electron/**'] },
  // The imported canvas predates React Compiler. Keep these migration diagnostics
  // visible without making compiler adoption a requirement for hosted deployment.
  { files: ['components/**/*.js', 'pages/index.js'], rules: {
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/static-components': 'warn',
    'react-hooks/purity': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/preserve-manual-memoization': 'warn',
    'react/no-unescaped-entities': 'warn',
  } },
];
