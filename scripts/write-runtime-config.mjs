import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define default values
const defaultApiUrl = 'http://localhost:8787/api/v1';
const defaultClerkKey = 'pk_test_c2V0dGxlZC1iYWRnZXItNjEuY2xlcmsuYWNjb3VudHMuZGV2JA';
const defaultEnv = 'local';

// Read environment variables
const apiUrl = process.env.NG_APP_API_BASE_URL || defaultApiUrl;
const clerkKey = process.env.NG_APP_CLERK_PUBLISHABLE_KEY || defaultClerkKey;
const env = process.env.NG_APP_ENV || defaultEnv;

const configContent = `// Runtime configuration
window.config = {
  NG_APP_API_BASE_URL: '${apiUrl}',
  NG_APP_CLERK_PUBLISHABLE_KEY: '${clerkKey}',
  NG_APP_ENV: '${env}'
};
`;

const targetPath = path.resolve(__dirname, '../public/config.js');

try {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, configContent, 'utf8');
  console.log(`Successfully generated runtime configuration at: ${targetPath}`);
  console.log(`NG_APP_API_BASE_URL: ${apiUrl}`);
  console.log(`NG_APP_CLERK_PUBLISHABLE_KEY: ${clerkKey}`);
  console.log(`NG_APP_ENV: ${env}`);
} catch (error) {
  console.error('Error writing runtime configuration file:', error);
  process.exit(1);
}
