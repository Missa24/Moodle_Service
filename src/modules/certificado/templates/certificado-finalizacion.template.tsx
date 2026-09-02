import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    Font,
} from '@react-pdf/renderer';

import * as path from 'path';
import { readFileSync } from 'fs';

import { CertificadoCursoPdfData } from 'src/modules/certificado/types/certificado-pdf-data';
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
    'certificado_curso.jpg',
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
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
    },

    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },

    codigo: {
        position: "absolute",
        top: "15%",
        left: "12.1%",
        fontFamily: "Helvetica-Oblique",
        fontSize: 15,
        color: COLORS.muted,
        letterSpacing: 0.5,
    },

    titulo: {
        position: 'absolute',
        top: '30%',
        left: '8%',
        width: '84%',
        textAlign: 'center',
        fontFamily: 'CormorantSemiBold',
        fontSize: 26,
        color: COLORS.gold,
        letterSpacing: 1.2,
    },

    introduccion: {
        position: 'absolute',
        top: '37%',
        left: '15%',
        width: '70%',
        textAlign: 'center',
        fontFamily: 'CormorantRegular',
        fontSize: 11.5,
        lineHeight: 1.5,
        color: COLORS.text,
    },

    academia: {
        fontFamily: 'CormorantSemiBold',
        color: COLORS.gold,
    },

    curso: {
        position: 'absolute',
        top: '45.5%',
        left: '8%',
        width: '84%',
        textAlign: 'center',
        fontFamily: 'CormorantSemiBold',
        fontSize: 22,
        color: COLORS.gold,
        letterSpacing: 0.8,
    },

    otorgado: {
        position: 'absolute',
        top: '51.2%',
        left: '10%',
        width: '80%',
        textAlign: 'center',
        fontFamily: 'CormorantRegular',
        fontSize: 11.5,
        color: COLORS.text,
    },

    nombre: {
        position: 'absolute',
        top: '54%',
        left: '5%',
        width: '90%',
        textAlign: 'center',
        fontFamily: 'GreatVibes',
        fontSize: 30,
        color: COLORS.text,
    },

    contenido: {
        position: 'absolute',
        top: '61.2%',
        left: '17%',
        width: '66%',
        textAlign: 'center',
        fontFamily: 'CormorantRegular',
        fontSize: 11.5,
        lineHeight: 1.45,
        color: COLORS.text,
    },

    resumenTitulo: {
        fontFamily: 'CormorantSemiBold',
        fontSize: 13,
        color: COLORS.gold,
    },

    resumen: {
        fontFamily: 'CormorantRegular',
        fontSize: 11.5,
    },

    cargaHoraria: {
        fontFamily: 'CormorantSemiBold',
        fontSize: 11.5,
    },

    fecha: {
        fontFamily: 'CormorantSemiBold',
        fontSize: 11.5,
    },

    qr: {
        position: 'absolute',
        width: 60,
        height: 60,
        right: '10%',
        top: '12%',
    },

});

export function CertificadoCursoTemplate({
    data,
    qrDataUrl,
}: {
    data: CertificadoCursoPdfData;
    qrDataUrl: string;
}): JSX.Element {

    const fechaFormateada = new Intl.DateTimeFormat('es-BO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(data.fecha));

    return (
        <Document
            title={`Certificado de finalización - ${data.nombre}`}
            author="Elite Academy"
            subject={`Certificación en ${data.curso}`}
        >
            <Page
                size="LETTER"
                orientation="portrait"
                style={styles.page}
            >
                <Image
                    src={certificadoImg}
                    style={styles.background}
                />

                <Text style={styles.codigo}>
                    {data.codigoVerificacion}
                </Text>

                <Text style={styles.titulo}>
                    CERTIFICADO DE FINALIZACIÓN
                </Text>

                <Text style={styles.introduccion}>
                    <Text style={styles.academia}>
                        ELITE ACADEMY
                    </Text>{' '}
                    formando profesionales en el área de la belleza,
                    se enorgullece en otorgar este certificado al
                    distinguido alumno por completar con éxito la
                    certificación en:
                </Text>

                <Text style={styles.curso}>
                    {data.curso}
                </Text>

                <Text style={styles.otorgado}>
                    Se otorga a:
                </Text>

                <Text style={styles.nombre}>
                    {data.nombre}
                </Text>

                <Text style={styles.contenido}>

                    {'\n'}

                    <Text style={styles.resumen}>
                        {data.resumen}
                    </Text>

                    {'\n\n'}

                    <Text style={styles.cargaHoraria}>
                        Carga horaria: {data.cargaHoraria ?? '20'} horas
                    </Text>

                    {'\n'}

                    <Text style={styles.fecha}>
                        Finalizado el {fechaFormateada}
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
