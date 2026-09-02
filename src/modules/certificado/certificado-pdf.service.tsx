import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import * as QRCode from 'qrcode';

import { CertificadoPdfData, CertificadoCursoPdfData } from './types/certificado-pdf-data';

import { CertificadoParticipacionTemplate } from './templates/certificado-participacion.template';
import { CertificadoCursoTemplate } from './templates/certificado-finalizacion.template';

@Injectable()
export class CertificadoPdfService {

    async generarPdf(
        data: CertificadoPdfData | CertificadoCursoPdfData,
    ): Promise<Buffer> {

        const qrDataUrl = await QRCode.toDataURL(
            data.urlVerificacion,
            {
                margin: 1,
                width: 200,
            },
        );

        if (data.tipo === 'modulo') {

            return await renderToBuffer(
                <CertificadoParticipacionTemplate
                    data={data as CertificadoPdfData}
                    qrDataUrl={qrDataUrl}
                />,
            );

        }

        if (data.tipo === 'curso') {

            return await renderToBuffer(
                <CertificadoCursoTemplate
                    data={data as CertificadoCursoPdfData}
                    qrDataUrl={qrDataUrl}
                />,
            );

        }

        throw new Error(
            `Tipo de certificado no soportado: ${data.tipo}`,
        );
    }
}
