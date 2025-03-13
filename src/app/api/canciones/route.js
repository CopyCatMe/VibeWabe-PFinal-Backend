import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";


/**
 * Verificar si se ha proporcionado una clave de API válida
 * @param {Request} request La solicitud HTTP
 * @returns {Response} La respuesta con un estado 401 si la clave no es válida
 */
export async function OPTIONS(request) {
    return new Response("OK", { status: 200 });
}

/**
 * Autenticar al usuario con la clave de API
 * @param {Request} request La solicitud HTTP
 * @returns {Response} La respuesta con un estado 200 si se autentica correctamente o 401 si no se autentica
 */
export async function POST(request) {
    try {
        // Verificar la clave de API
        const keyHeader = request.headers.get("x-api-key");
        if (!keyHeader || keyHeader !== process.env.CLIENT_API_KEY) {
            return new Response(
                JSON.stringify({ message: "No tienes permiso para acceder a este recurso" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION_SONGS);

        // Obtener los datos cifrados desde la solicitud
        let body = await request.json();
        console.log(body)

        // Destructuracion de body
        const { audioUrl, imageUrl, songName, userName } = body;

        const newSong = {
            audioUrl: audioUrl,
            imageUrl: imageUrl,
            songName: songName,
            userName: userName,
            created_at: new Date().toISOString(),
        };

        await collection.insertOne(newSong);
        return new Response(
            JSON.stringify({ message: "Canción agregada correctamente" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error en el servidor:", error);
        return new Response(
            JSON.stringify({ message: "Hubo un error en el servidor" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}


export async function GET(request, { params }) {
    const apiKeyHeader = request.headers.get("x-api-key");
    if (apiKeyHeader !== process.env.CLIENT_API_KEY) {
        return Response.json(
            { message: "No tienes permiso para acceder a este recurso" },
            { status: 401 }
        );
    };


    const buscador = request.nextUrl.searchParams.get("buscador");
    let songs = [];

    const { database } = await connectToDatabase();
    const collection = database.collection(process.env.MONGODB_COLLECTION_SONGS);

    if (!buscador || buscador.trim() === "") { // Verificamos si es vacío o espacios en blanco
        songs = await collection.find().sort({ created_at: -1 }).toArray();
    } else {
        songs = await collection.find({
            $or: [
                { songName: { $regex: new RegExp(buscador, "i") } },
                { userName: { $regex: new RegExp(buscador, "i") } }
            ]
        }).sort({ created_at: -1 }).toArray();
    }

    console.log(songs)

    return Response.json(songs);
}


export async function PATCH(request) {
    try {
        // Verificar la clave de API
        const keyHeader = request.headers.get("x-api-key");
        if (!keyHeader || keyHeader !== process.env.CLIENT_API_KEY) {
            return new Response(
                JSON.stringify({ message: "No tienes permiso para acceder a este recurso" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION_SONGS);

        // Obtener los datos desde la solicitud
        const body = await request.json();
        const { songId, like, likeUser } = body;
        // Log the request body for debugging purposes
        console.debug("Request Body:", body);

        // Validación de datos
        if (!songId || like === undefined || !likeUser) {
            return new Response(
                JSON.stringify({ message: "Datos incompletos" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Asegúrate de que el songId sea un ObjectId válido
        const objectId = ObjectId.isValid(songId) ? new ObjectId(songId) : null;
        if (!objectId) {
            return new Response(
                JSON.stringify({ message: "ID de canción no válido" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

       
        const updateQuery = like
            ? { $inc: { likes: +1 }, $addToSet: { likedBy: likeUser } } // Agregar el like
            : { $inc: { likes: -1 }, $pull: { likedBy: likeUser } }; // Eliminar el like

        const result = await collection.updateOne(
            { _id: songId },
            updateQuery
        );


        // Verificar si la canción fue encontrada
        if (result.matchedCount === 0) {
            return new Response(
                JSON.stringify({ message: "Canción no encontrada" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Responder con éxito
        return new Response(
            JSON.stringify({ message: like ? "Like añadido correctamente" : "Like eliminado correctamente" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error en el servidor:", error);
        return new Response(
            JSON.stringify({ message: "Hubo un error en el servidor" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}