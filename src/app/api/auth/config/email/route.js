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

        // console.log(process.env.ENCRYPTION_SERVER_KEY);

        let {id_usuario, email} = body;
        let subdata = JSON.parse(id_usuario);
        let id_user = subdata;

        console.log(id_user);
        console.log(email);

        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION);

        const usuario = await collection.findOne( {_id: new ObjectId(id_user.id_usuario)} );
        
        if (usuario.email == email.toUpperCase()) {
            return Response.json(
                { message: "El email es el mismo" },
                { status: 401 }
            );
        }

        const results = await collection.updateOne(
            { _id: new ObjectId(id_user.id_usuario) },
            { $set: { email } }
        );

        return Response.json({
            message: "Datos enviados correctamente"
        }, { status: 200 });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return Response.json({ message: "Hubo un error en el servidor" }, { status: 500 });
    }
}
