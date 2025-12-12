/**
 * @file api/rate/route.ts
 * @author Aiden Telgenhof
 * @fileoverview Handles rating submissions by users.
 */
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

let client: MongoClient | null = null;

export async function POST(req: Request) {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("analytics");
    const events = db.collection("ratings");

    const { value, userId } = await req.json();

    await events.insertOne({
        userId: new ObjectId(userId),
        value,
        timestamp: Date.now()
    });

    return NextResponse.json({ success: true });
}