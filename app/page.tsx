"use client";
import { useEffect, useState } from "react";
import GaugeChart from "./GaugeChart";
import RatingsGraph from "./RatingsGraph";

export default function Page() {
    const [average, setAverage] = useState(0);
    const [events, setEvents] = useState<number[]>([]);

    const clear = async () => {
        await fetch("/api/ratings", { method: "DELETE" });
    };

    useEffect(() => {
        let es: EventSource | null = null;

        const connect = () => {
            es = new EventSource("/api/stream");

            es.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setAverage(data.average);
                setEvents(data.events);
            };

            es.onerror = () => {
                es?.close();
                setTimeout(connect, 1000);
            };
        };

        connect();

        return () => {
            es?.close();
        };
    }, []);

    return (
        <div className="page-container">
            <h1>Average: {average}</h1>
            <GaugeChart average={average} onClear={clear} />
            <RatingsGraph
                events={events}
                windowSeconds={60}
                sampleIntervalMs={100}
            />
        </div>
    );
}