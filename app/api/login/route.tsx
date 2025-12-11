import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

let client: MongoClient | null = null;

export async function POST(req: Request) {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const { username } = await req.json();

    const db = client.db("analytics");
    const users = db.collection("users");
    const sessions = db.collection("sessions");

    let user = await users.findOne({ username });

    if (!user) {
        const result = await users.insertOne({
            username,
            createdAt: Date.now()
        });
        user = { _id: result.insertedId, username };
    }

    await sessions.insertOne({
        userId: user._id,
        startedAt: Date.now(),
        lastActive: Date.now()
    });

    return NextResponse.json({ userId: user._id.toString() });
}
