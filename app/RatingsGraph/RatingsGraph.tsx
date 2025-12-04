"use client";
import "./RatingsGraph.css";
import { useEffect, useRef } from "react";

type RatingGraphProps = {
    events: number[];
    windowSeconds: number;
    sampleIntervalMs: number;
};

export default function RatingsGraph({
    events,
    windowSeconds,
    sampleIntervalMs
}: RatingGraphProps) {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const css = () => {
        const root = getComputedStyle(document.documentElement);
        return {
            lineColor: root.getPropertyValue("--graph-line-color").trim(),
            lineWidth: parseFloat(root.getPropertyValue("--graph-line-width")),
            fillColor: root.getPropertyValue("--graph-fill-color").trim(),
            gridColor: root.getPropertyValue("--graph-grid-color").trim(),
            textColor: root.getPropertyValue("--graph-text-color").trim(),
            tickColor: root.getPropertyValue("--graph-tick-color").trim(),
            badgeColor: root.getPropertyValue("--graph-badge-color").trim(),
            fontMain: root.getPropertyValue("--graph-font-main").trim(),
            fontBadge: root.getPropertyValue("--graph-font-badge").trim(),
        };
    };

    const computePoints = (now: number) => {
        const samples: number[] = [];
        const steps = Math.max(2, Math.floor((windowSeconds * 1000) / sampleIntervalMs));

        for (let i = 0; i <= steps; i++) {
            samples.push(now - (windowSeconds * 1000) + (i * sampleIntervalMs));
        }

        const sorted = [...events].sort((a, b) => a - b);

        return samples.map((t) => ({
            t,
            count: sorted.filter(e => e <= t).length
        }));
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const styles = css();

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.scale(dpr, dpr);

        const now = Date.now();
        const points = computePoints(now);

        const padding = { left: 40, right: 10, top: 10, bottom: 20 };
        const w = rect.width - padding.left - padding.right;
        const h = rect.height - padding.top - padding.bottom;

        const windowMs = windowSeconds * 1000;
        const t0 = now - windowMs;

        const counts = points.map((p) => p.count);
        const maxCount = Math.max(1, ...counts);

        ctx.clearRect(0, 0, rect.width, rect.height);

        // Gridlines
        ctx.strokeStyle = styles.gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const yGridCount = 4;
        for (let i = 0; i <= yGridCount; i++) {
            const yy = padding.top + (i * (h / yGridCount));
            ctx.moveTo(padding.left, yy);
            ctx.lineTo(padding.left + w, yy);
        }
        ctx.stroke();

        // Y Axis ticks
        ctx.fillStyle = styles.textColor;
        ctx.font = styles.fontMain;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= yGridCount; i++) {
            const v = Math.round(maxCount - (i * (maxCount / yGridCount)));
            const yy = padding.top + (i * (h / yGridCount));
            ctx.fillText(String(v), padding.left - 8, yy);
        }

        // X Axis ticks
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = styles.tickColor;

        const tickCount = 5;
        for (let i = 0; i <= tickCount; i++) {
            const tt = t0 + (i * (windowMs / tickCount));
            const x = padding.left + (i * (w / tickCount));
            const d = new Date(tt);
            const label = `${String(d.getHours()).padStart(2, "0")}:${String(
                d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
            ctx.fillText(label, x, rect.height - padding.bottom + 4);
        }

        // Graph line
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (!p) continue;
            const x = padding.left + ((p.t - t0) / windowMs) * w;
            const y = padding.top + h - (p.count / maxCount) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineWidth = styles.lineWidth;
        ctx.strokeStyle = styles.lineColor;
        ctx.stroke();

        // Fill
        ctx.lineTo(padding.left + w, padding.top + h);
        ctx.lineTo(padding.left, padding.top + h);
        ctx.closePath();
        ctx.fillStyle = styles.fillColor;
        ctx.fill();

        // Label for total count
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = styles.badgeColor;
        ctx.font = styles.fontBadge;
        ctx.fillText(`Total: ${counts.at(-1)}`, padding.left, padding.top - 2);
    };

    useEffect(() => {
        const loop = () => {
            draw();
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [events]);

    useEffect(() => {
        const onResize = () => draw();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div className="ratings-graph-container">
            <canvas ref={canvasRef} className="ratings-graph-canvas" />
        </div>
    );
}