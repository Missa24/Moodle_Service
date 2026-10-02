import fs from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';

async function main() {
    const credentialsPath = path.resolve('credentials.json');

    if (!fs.existsSync(credentialsPath)) {
        throw new Error('No existe credentials.json en la raíz del backend');
    }

    const auth = await authenticate({
        keyfilePath: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const json = JSON.parse(
        fs.readFileSync(credentialsPath, 'utf8'),
    );

    const credentials = json.installed ?? json.web;

    if (!credentials) {
        throw new Error('credentials.json no tiene formato OAuth válido');
    }

    const refreshToken = auth.credentials.refresh_token;

    if (!refreshToken) {
        throw new Error(
            'Google no devolvió refresh_token. Intenta autorizar nuevamente.',
        );
    }

    console.log('\n✅ AUTORIZACIÓN COMPLETADA\n');

    console.log(
        `GOOGLE_DRIVE_CLIENT_ID=${credentials.client_id}`,
    );

    console.log(
        `GOOGLE_DRIVE_CLIENT_SECRET=${credentials.client_secret}`,
    );

    console.log(
        `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`,
    );

    console.log('\nCopia estas 3 variables a tu .env\n');
}

main().catch((error) => {
    console.error('\n❌ ERROR:\n', error);
    process.exit(1);
});