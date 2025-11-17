"use client";
import { useState } from "react";

export default function Page() {
    const [ratings, setRatings] = useState<number[]>([]);

    const handleRate = (value: number) => {
        setRatings((prev) => [...prev, value]);
    }

    const avg: number = ratings.length
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
        : 0

    return (
        <div className="page-container">
            <h1>Average: {avg}</h1>
            <GaugeChart average={avg} onRate={handleRate} />
        </div>
    );
}

type GaugeChartProps = {
    onRate: (value: number) => void;
    average: number
}

function GaugeChart({ onRate, average }: GaugeChartProps) {
    const values = [1, 2, 3, 4, 5];
    const rotation = ((average - 1) / 4) * 180 - 90; 

    return (
        <div className="gauge-container">
            <div className="gauge-face">
                {values.map((v) => {
                    const tickRotation = ((v - 1) / 4) * 180 - 90;
                    return (
                        <div
                            key={v}
                            className="gauge-tick-container"
                            style={{ transform: `rotate(${tickRotation}deg` }}
                        >
                            <span className="gauge-tick"></span>
                            <span className="tick-label">{v}</span>
                        </div>
                    )
                })}

                <div
                    className="gauge-needle"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                />
            </div>
            <ul className="rating-buttons">
                {values.map((v) => (
                    <li key={v}>
                        <button className="rating-button" onClick={() => onRate(v)}>
                            {v}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}