import { comparePassword } from "@/lib/cryptoUtils";
import { connectToDatabase } from "@/lib/mongodb";

export async function OPTIONS(request) {
    // Respuesta OK para solicitudes OPTIONS (pre-flight requests)
    return new Response("OK", { status: 200 });
}

export async function POST(request) {
    try {

        const keyHeader = request.headers.get("x-api-key");
        // Verificación de la clave de API
        if (keyHeader !== process.env.CLIENT_API_KEY) {
            return new Response(
                JSON.stringify({ message: "No tienes permiso para acceder a este recurso" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Conexión a la base de datos
        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION);
        const body = await request.json();
        const { email, password } = body;

        // Buscar al usuario en la base de datos
        const usuario = await collection.findOne({ email: email.toLowerCase() });

        // Verificar si el usuario existe
        if (!usuario) {
            return new Response(
                JSON.stringify({ message: "El email no existe" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Verificar la contraseña ingresada
        const passwordMatch = await comparePassword(password, usuario.password);
        console.log("Email recibido:", email);
        console.log("Contraseña recibida:", password);
        console.log("Contraseña almacenada en la base de datos:", usuario.password);
        if (!passwordMatch) {
            return new Response(
                JSON.stringify({ message: "La contraseña es incorrecta" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Crear el token de inicio de sesión (usando el ID del usuario)
        const loginToken = {
            id_usuario: usuario._id,
        };

        // Preparar los datos del usuario para la respuesta
        const userData = {
            name: usuario.name,
            avatar_url: usuario.avatar_url,
        };

        // Encriptar el token de inicio de sesión para enviarlo de forma segura
        const encryptedLoginToken = loginToken;

        // Responder con el token de inicio de sesión y los datos del usuario
        return new Response(
            JSON.stringify({
                message: "Autenticación exitosa",
                body: {
                    loginToken: JSON.stringify(encryptedLoginToken),
                    userData: JSON.stringify(userData),
                },
            }),
            { status: 202, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error en el servidor:", error);
        // Manejo de errores del servidor
        return new Response(
            JSON.stringify({ message: "Hubo un error en el servidor" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
