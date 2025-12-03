import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function GET() {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("analytics");
    const ratings = db.collection("ratings");

    const docs = await ratings.find().sort({ timestamp: 1 }).toArray();

    const values = docs.map(d => d.value);
    const avg = values.length
        ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
        : 0;

    return NextResponse.json({
        average: avg,
        events: docs.map(d => d.timestamp),
    });
}

export async function DELETE() {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("analytics");
    const ratings = db.collection("ratings");

    await ratings.deleteMany({});

    return NextResponse.json({ success: true });
}
