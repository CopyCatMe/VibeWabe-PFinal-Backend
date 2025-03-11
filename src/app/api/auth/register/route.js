import { hashPassword } from "@/lib/cryptoUtils";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Verificar la clave de API
 */
export async function OPTIONS(request) {
    return new Response("OK", { status: 200 });
}

/**
 * Crear un nuevo usuario
 */
export async function POST(request) {
    try {
        const keyHeader = request.headers.get("x-api-key");
        if (!keyHeader || keyHeader !== process.env.CLIENT_API_KEY) {
            return new Response(
                JSON.stringify({ message: "No tienes permiso para acceder a este recurso" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { database } = await connectToDatabase();
        const collection = database.collection(process.env.MONGODB_COLLECTION);
        const body = await request.json();

        const { email, password, name } = body;
        console.log(body);

        const usuarioExiste = await collection.findOne({ email: email.toLowerCase() });
        if (usuarioExiste) {
            return new Response(
                JSON.stringify({ message: "El usuario ya existe" }),
                { status: 406, headers: { "Content-Type": "application/json" } }
            );
        }

        const avatar_url = generateAvatarUrl(name);

        const hashedPassword = await hashPassword(password); // 🔥 Hashear la contraseña antes de guardarla

        const newUser = {
            email: email.toLowerCase(),
            password: hashedPassword, // ✅ Ahora está protegida
            name,
            avatar_url,
            created_at: new Date().toISOString(),
        };

        await collection.insertOne(newUser);

        const usuario = await collection.findOne({ email: email.toLowerCase() });
        const loginToken = { id_usuario: usuario._id };
        const userData = { name: usuario.name, avatar_url: usuario.avatar_url };
        const encryptedLoginToken = loginToken;

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
        return new Response(
            JSON.stringify({ message: "Hubo un error en el servidor" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

}

/**
 * Generar avatar aleatorio
 */
function generateAvatarUrl(name) {
    const availableColors = ["pink", "brown", "teal", "cyan", "olive", "lime", "coral", "mint", "lavender", "silver"];
    const getRandomColor = () => {
        const idx = Math.floor(Math.random() * availableColors.length);
        return availableColors[idx];
    };
    return `https://placehold.co/400x400/${getRandomColor()}/white?text=${name.substring(0, 1).toUpperCase()}`;
}
