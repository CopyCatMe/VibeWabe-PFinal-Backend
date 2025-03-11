import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function OPTIONS(request) {
    return new Response("OK", { status: 200 });
}

export async function POST(request) {
    try {
        // Verificar la clave de API
        const keyHeader = request.headers.get("x-api-key");
        if (keyHeader !== process.env.CLIENT_API_KEY) {
            return Response.json(
                { message: "No tienes permiso para acceder a este recurso" },
                { status: 401 }
            );
        }

        // Obtener los datos cifrados desde la solicitud
        const body = await request.json();
        console.log(body);

        let { id_usuario } = body;

        console.log(id_usuario);

        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION);

        const usuario = await collection.findOne( {_id: new ObjectId(id_usuario)} );

        if (!usuario) {
            return Response.json(
                { message: "El usuario no existe" },
                { status: 401 }
            );
        }

        const userData = {
            name: usuario.name,
            avatar_url: usuario.avatar_url,
            email: usuario.email,
        };

        return Response.json({
            message: "Datos enviados correctamente",
            body: JSON.stringify(userData), 
        }, { status: 200 });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return Response.json({ message: "Hubo un error en el servidor" }, { status: 500 });
    }
}

