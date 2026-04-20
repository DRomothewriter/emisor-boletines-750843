const expediente = "750843";
const nombre_completo = "Diego Romo Mendoza";

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const app = express();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
        sessionToken: process.env.AWS_SESSION_TOKEN || "",
    },
});

const sqs = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
        sessionToken: process.env.AWS_SESSION_TOKEN || "",
    },
});

const upload = multer({
    storage: multerS3({
        s3,
        bucket: `practica-4-${expediente}`,
        metadata: (req, file, cb) => {
            cb(null, { ...file });
        },
        key: (req, file, cb) => {
            cb(null, file.originalname);
        },
    }),
});

app.post("/boletines", upload.single("image"), async (req, res) => {
    const { message, email } = req.body;
    const url = (req.file as Express.MulterS3.File).location;
    try {
        const params = {
            QueueUrl: process.env.SQS_URL || "",
            MessageBody: JSON.stringify({ message, email, url }),
        };
        const command = new SendMessageCommand(params);
        const response = await sqs.send(command);
        console.log(response);
        return res.status(200).json({ success: true, message: "Boletín enviado a SQS", url });
    } catch (e) {
        return res.status(500).json({
            success: false,
            error: "Error enviando a SQS",
            details: (e as Error).message,
        });
    }
});

const preguntas = `
1. ¿Qué ventajas y desventajas ves al utilizar colas para gestionar la comunicación entre contenedores en contraste a protocolos sincrónicos como HTTP?
Manejarlo con colas es mucho mas seguro en cuanto a que no se pierde informacion. Con http, si se cae el servidor se pierden los mensajes y con las colas se quedan guardados en las colas. Tambien es menos pesado y más rápido porque el emisor no tiene que esperar la respuesta, solo lo manda. Lo malo que le veo es que se vuelve más complejo el proceso.
2. ¿Cuál consideras que sería una manera de incrementar la resiliencia de la aplicación en caso de que el envío de un mensaje falle?
Podriamos hacer que reintente unas cuantas veces extra. También podríamos hacer un tipo respaldo hasta que confirmen que no falló el envío
3. ¿Qué otro método crees que exista para el monitoreo de mensajes de manera sincrónica además de colas/notificaciones?
Pues conozco webSockets pero aunque es una conexión rápida, es muy inestable y aunque se reconecte automáticamente igual puede perderse información en ese tiempo de reconexión. También el long polling de http pero entiendo que es muy pesado para el servidor.
`;

const conclusiones = `
Escribe aquí tus conclusiones sobre la práctica.
Me gustó bastante la práctica. Me sentí como que ya estuve desarrllando una aplicación mucho más profesional y con funciones más apegadas a la industria. Además pude comprender mucho mejor y a profundidad los temas de las colas de notificaciones y los contenedores que no me había quedado muy claro en las clases ya que no comprendía realmente qué estábamos haciendo o para que podría servir. 
`;

if (require.main === module) {
    console.log("Evaluación de la práctica 4");
    console.log(nombre_completo);
    console.log(expediente);
    console.log(preguntas);
    console.log(conclusiones);
}

app.listen(8080);
