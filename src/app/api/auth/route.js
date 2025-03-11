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

        // Obtener los datos cifrados desde la solicitud
        const body = await request.json();

        // Decodificar los datos
        let { idUser } = body;

        // Conectar a la base de datos
        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION);

        // Buscar el usuario en la base de datos
        const usuario = await collection.findOne({ _id: new ObjectId(idUser) });

        if (!usuario) {
            return new Response(
                JSON.stringify({ message: "El usuario no existe" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Devolver los datos del usuario autenticado
        const userData = {
            name: usuario.name,
            avatar_url: usuario.avatar_url,
        };

        return new Response(
            JSON.stringify({
                message: "Inicio de sesión exitoso",
                body: userData,
            }),
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

