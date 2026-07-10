const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL=')) {
            const dbUrl = trimmed.split('DATABASE_URL=')[1].replace(/['"]/g, '');
            process.env.DATABASE_URL = dbUrl;
            console.log('Set DATABASE_URL from .env.local');
            break;
        }
    }
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
}

const result = spawnSync('npx', ['drizzle-kit', 'push'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
});

process.exit(result.status);
