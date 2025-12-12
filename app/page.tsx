/**
 * @file page.tsx
 * @author Aiden Telgenhof
 * @fileoverview This file contains the main page component for the application.
 */
"use client";
import { useEffect, useState } from "react";
import GaugeChart from "./GaugeChart/GaugeChart";
import RatingsGraph from "./RatingsGraph/RatingsGraph";
import LoginComponent from "./LoginComponent/LoginComponent";
import Leaderboard from "./Leaderboard/Leaderboard";

export default function Page() {
    const [userId, setUserId] = useState<string | null>(null);
    const [average, setAverage] = useState(0);
    const [events, setEvents] = useState<number[]>([]);

    /**
     * Load userId from local cookies if it has been cached previously.
     * NOTE: I did have cookies working, but it was messing with the login page
     * so I scrapped the storing of cookies for now.
     */
    useEffect(() => {
        const id = localStorage.getItem("userId");
        if (id) setUserId(id);
    }, []);

    /**
     * Calls the DELETE method from the ratings route to clear all data
     * stored in the ratings table.
     */
    const clear = async () => {
        await fetch("/api/ratings", { method: "DELETE" });
    };

    /**
     * Sets up an EventSource connection to the /api/stream endpoint to
     * receive real-time updates of the average rating and events.
     */
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
    }, [userId]);

    /**
     * If the user is not logged in, render the LoginComponent.
     */
    if (!userId) {
        return <LoginComponent onLogin={(id) => setUserId(id)} />;
    }

    /**
     * Render the main page content.
     */
    return (
        <div className="page-container">
            <h1>Average: {average}</h1>
            
            <div className="charts-container">
                <GaugeChart 
                    average={average}
                    onClear={clear}
                    userId={userId} 
                />
                <Leaderboard />
            </div>

            <RatingsGraph
                events={events}
                windowSeconds={60}
                sampleIntervalMs={100}
            />
        </div>
    );
}