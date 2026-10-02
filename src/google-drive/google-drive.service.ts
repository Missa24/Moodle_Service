import {
    BadRequestException,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
    private readonly logger = new Logger(GoogleDriveService.name);
    private readonly drive: drive_v3.Drive;

    constructor() {
        const {
            GOOGLE_DRIVE_CLIENT_ID,
            GOOGLE_DRIVE_CLIENT_SECRET,
            GOOGLE_DRIVE_REFRESH_TOKEN,
        } = process.env;

        if (
            !GOOGLE_DRIVE_CLIENT_ID ||
            !GOOGLE_DRIVE_CLIENT_SECRET ||
            !GOOGLE_DRIVE_REFRESH_TOKEN
        ) {
            throw new Error(
                'Faltan variables de Google Drive en el .env',
            );
        }

        const auth = new google.auth.OAuth2(
            GOOGLE_DRIVE_CLIENT_ID,
            GOOGLE_DRIVE_CLIENT_SECRET,
        );

        auth.setCredentials({
            refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
        });

        this.drive = google.drive({
            version: 'v3',
            auth,
        });
    }

    async onModuleInit() {
        try {
            const { data } = await this.drive.about.get({
                fields: 'user(displayName,emailAddress)',
            });

            this.logger.log(
                `Google Drive conectado: ${data.user?.emailAddress ??
                data.user?.displayName ??
                'Cuenta desconocida'
                }`,
            );
        } catch (error) {
            this.logger.error(
                'No se pudo conectar con Google Drive',
            );

            throw error;
        }
    }

    async subirVideo(
        video: Express.Multer.File,
        folderId?: string,
    ): Promise<{
        id: string;
        name?: string | null;
        mimeType?: string | null;
        size?: string | null;
    }> {
        if (!video.mimetype.startsWith('video/')) {
            throw new BadRequestException(
                'El archivo enviado debe ser un video',
            );
        }

        const { data } = await this.drive.files.create({
            requestBody: {
                name: `${Date.now()}-${video.originalname}`,
                mimeType: video.mimetype,

                ...(folderId
                    ? {
                        parents: [folderId],
                    }
                    : {}),
            },

            media: {
                mimeType: video.mimetype,
                body: Readable.from(video.buffer),
            },

            fields: 'id,name,mimeType,size',
        });

        if (!data.id) {
            throw new Error(
                'Google Drive no devolvió el ID del archivo',
            );
        }

        return {
            id: data.id,
            name: data.name,
            mimeType: data.mimeType,
            size: data.size,
        };
    }

    async obtenerArchivo(fileId: string) {
        const { data } = await this.drive.files.get({
            fileId,
            fields: 'id,name,mimeType,size',
        });

        return data;
    }

    async obtenerVideo(
        fileId: string,
        range?: string,
    ) {
        const { data } = await this.drive.files.get(
            {
                fileId,
                alt: 'media',
            },
            {
                responseType: 'stream',

                ...(range
                    ? {
                        headers: {
                            Range: range,
                        },
                    }
                    : {}),
            },
        );

        return data;
    }

    extraerFileId(valor: string): string | null {
        if (!valor) {
            return null;
        }

        const limpio = valor.trim();

        const patrones = [
            /\/file\/d\/([^/?]+)/,
            /\/d\/([^/?]+)/,
            /[?&]id=([^&]+)/,
        ];

        for (const patron of patrones) {
            const match = limpio.match(patron);

            if (match?.[1]) {
                return match[1];
            }
        }

        // Permite mandar directamente el fileId.
        if (
            !limpio.includes('/') &&
            !limpio.startsWith('http')
        ) {
            return limpio;
        }

        return null;
    }
}