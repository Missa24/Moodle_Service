import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    Font,
} from '@react-pdf/renderer';

import * as path from 'path';
import { existsSync, readFileSync } from 'fs';

import { CertificadoPdfData } from 'src/modules/certificado/types/certificado-pdf-data';
import type { JSX } from 'react';

const ASSETS = path.join(
    process.cwd(),
    'src',
    'modules',
    'certificado',
    'assets',
);

const greatVibesPath = path.join(
    ASSETS,
    'fonts',
    'GreatVibes-Regular.ttf',
);

const cormorantRegularPath = path.join(
    ASSETS,
    'fonts',
    'CormorantGaramond-Regular.ttf',
);

const cormorantSemiBoldPath = path.join(
    ASSETS,
    'fonts',
    'CormorantGaramond-SemiBold.ttf',
);

const certificadoImgPath = path.join(
    ASSETS,
    'certificado_modulo.jpg',
);


Font.register({
    family: 'GreatVibes',
    src: greatVibesPath,
});

Font.register({
    family: 'CormorantRegular',
    src: cormorantRegularPath,
});

Font.register({
    family: 'CormorantSemiBold',
    src: cormorantSemiBoldPath,
});

const certificadoImg = readFileSync(certificadoImgPath);

const COLORS = {
    text: '#171717',
    gold: '#A87524',
    muted: '#555555',
};

const styles = StyleSheet.create({
    page: {
        position: 'relative',
        backgroundColor: '#ffffff',
    },

    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },

    titulo: {
        position: 'absolute',
        top: '31%',
        left: '10%',
        width: '80%',
        textAlign: 'center',
        fontFamily: 'CormorantSemiBold',
        fontSize: 30,
        color: COLORS.gold,
        letterSpacing: 1.3,
    },

    otorgado: {
        position: 'absolute',
        top: '43%',
        left: '10%',
        width: '80%',
        textAlign: 'center',
        fontFamily: 'CormorantRegular',
        fontSize: 13,
        color: COLORS.text,
    },

    nombre: {
        position: 'absolute',
        top: '48%',
        left: '5%',
        width: '90%',
        textAlign: 'center',
        fontFamily: 'GreatVibes',
        fontSize: 32,
        color: COLORS.text,
    },

    contenido: {
        position: 'absolute',
        top: '56%',
        left: '15%',
        width: '70%',
        textAlign: 'center',
        fontFamily: 'CormorantRegular',
        fontSize: 13,
        lineHeight: 1.5,
        color: COLORS.text,
    },

    modulo: {
        fontFamily: 'CormorantSemiBold',
        color: COLORS.gold,
        fontSize: 14,
    },

    fecha: {
        fontFamily: 'CormorantSemiBold',
        color: COLORS.text,
    },

    qr: {
        position: 'absolute',
        width: 60,
        height: 60,
        right: '10%',
        bottom: '8%',
    },
});

export function CertificadoParticipacionTemplate({
    data,
    qrDataUrl,
}: {
    data: CertificadoPdfData;
    qrDataUrl: string;
}): JSX.Element {
    const fechaFormateada = new Intl.DateTimeFormat('es-BO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(data.fecha));

    return (
        <Document
            title={`Certificado de participación - ${data.nombre}`}
            author="Elite Academy"
            subject={`Participación en el módulo de ${data.modulo}`}
        >
            <Page
                size="LETTER"
                orientation="landscape"
                style={styles.page}
            >
                <Image
                    src={certificadoImg}
                    style={styles.background}
                />

                <Text style={styles.titulo}>
                    CERTIFICADO DE PARTICIPACIÓN
                </Text>

                <Text style={styles.otorgado}>
                    Se otorga a:
                </Text>

                <Text style={styles.nombre}>
                    {data.nombre}
                </Text>

                <Text style={styles.contenido}>
                    Se otorga este certificado de participación en el
                    módulo de{' '}
                    <Text style={styles.modulo}>
                        "{data.modulo}"
                    </Text>

                    {'\n'}

                    finalizado el{' '}
                    <Text style={styles.fecha}>
                        {fechaFormateada}
                    </Text>
                </Text>

                <Image
                    src={qrDataUrl}
                    style={styles.qr}
                />
            </Page>
        </Document>
    );
}
