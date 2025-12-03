import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function GET(req: Request) {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("analytics");
    const ratings = db.collection("ratings");

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const send = (data: any) => {
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                    );
                } catch (err) {}
            };

            const changeStream = ratings.watch([], {
                fullDocument: "updateLookup"
            });

            changeStream.on("change", async () => {
                const docs = await ratings.find().sort({ timestamp: 1 }).toArray();

                const values = docs.map(d => d.value);
                const avg = values.length
                    ? Number((values.reduce((a,b)=>a+b,0) / values.length).toFixed(2))
                    : 0;

                send({
                    average: avg,
                    events: docs.map(d => d.timestamp)
                });
            });

            req.signal.addEventListener("abort", () => {
                changeStream.close().catch(() => {});
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    });
}
