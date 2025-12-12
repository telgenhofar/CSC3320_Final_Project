/**
 * @file GaugeChart.tsx
 * @author Aiden Telgenhof
 * @fileoverview This file contains all of the TypeScript code for the GaugeChart component.
 */
"use client";
import "./GaugeChart.css"

type GaugeChartProps = {
    average: number;
    onClear: () => void;
    userId: string;
};

/**
 * GaugeChart component that displays a gauge chart with a needle indicating the average rating.
 */
export default function GaugeChart({ average, onClear, userId }: GaugeChartProps) {
    const values = [1, 2, 3, 4, 5];
    const rotation = ((average - 1) / 4) * 180 - 90;

    const rate = async (value: number) => {
        await fetch("/api/rate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value, userId })
        });
    };

    return (
        <div className="gauge-container">
            <div className="gauge-face">
                {values.map((v) => {
                    const tickRotation = ((v - 1) / 4) * 180 - 90;
                    return (
                        <div
                            key={v}
                            className="gauge-tick-container"
                            style={{ transform: `rotate(${tickRotation}deg)` }}
                        >
                            <span className="gauge-tick"></span>
                            <span className="tick-label">{v}</span>
                        </div>
                    );
                })}

                <div
                    className="gauge-needle"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                />
            </div>

            <ul className="rating-buttons">
                {values.map((v) => (
                    <li key={v}>
                        <button
                            className="rating-button"
                            onClick={() => rate(v)}
                        >
                            {v}
                        </button>
                    </li>
                ))}
            </ul>

            <button className="rating-button" onClick={onClear}>
                Clear
            </button>
        </div>
    );
}
