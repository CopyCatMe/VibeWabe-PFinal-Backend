import { connectToDatabase } from "@/lib/mongodb";

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


