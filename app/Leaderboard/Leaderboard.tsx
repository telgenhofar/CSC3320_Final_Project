"user client";
import { useEffect, useState } from "react";
import "./Leaderboard.css";

type Entry = {
    _id: string;
    clicks: number;
    user: { username: string };
}

export default function Leaderboard() {
    const [data, setData] = useState<Entry[]>([]);

    useEffect(() => {
        const eventSource = new EventSource("/api/leaderboard/");

        eventSource.onmessage = (event) => {
            try {
                const leaderboard: Entry[] = JSON.parse(event.data);
                setData(leaderboard);
            } catch (err) {
                console.error("Failed to parse leaderboard data:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("Leaderboard EventSource error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        < div className="leaderboard-container">
            <h2 className="leaderboard-title">Leaderboard</h2>
            <div className="leaderboard-scroll">
                {data.map((entry, index) => (
                    <div key={entry._id} className="leaderboard-entry">
                        <span className="leaderboard-rank">{index + 1}</span>
                        <span className="leaderboard-name">{entry.user.username}</span>
                        <span className="leaderboard-clicks">{entry.clicks}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}