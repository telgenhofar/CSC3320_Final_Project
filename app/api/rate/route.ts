import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function POST(req: Request) {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("analytics");
    const ratings = db.collection("ratings");

    const { value } = await req.json();

    await ratings.insertOne({
        value,
        timestamp: Date.now()
    });

    return NextResponse.json({ success: true });
}