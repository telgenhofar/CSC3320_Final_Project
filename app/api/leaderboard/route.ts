/**
 * @file api/leaderboard/route.ts
 * @author Aiden Telgenhof
 * @fileoverview This file provides a server-sent events (SSE) endpoint for streaming
 * leaderboard data based on user ratings stored in a MongoDB database.
 */
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function GET(req: Request) {
    client ??= new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("analytics");
    const ratings = db.collection("ratings")
    const users = db.collection("users");

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
                const leaderboard = await ratings.aggregate([
                    {
                        $group: {
                            _id: "$userId",
                            clicks: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    { $unwind: "$user" },
                    { $sort: { clicks: -1, "user.username": 1 } }
                ]).toArray();

                send(leaderboard);
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