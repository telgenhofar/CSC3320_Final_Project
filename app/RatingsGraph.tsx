"use client";
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

    const computePoints = (now: number) => {
        const samples: number[] = [];
        const steps = Math.max(2, Math.floor((windowSeconds * 1000) / sampleIntervalMs));

        for (let i = 0; i <= steps; i++) {
            samples.push(now - (windowSeconds * 1000) + (i * sampleIntervalMs));
        }

        const sorted = [...events].sort((a, b) => a - b);

        const points = samples.map((t) => {
            const count = sorted.filter(e => e <= t).length;
            return { t, count };
        });

        return points;
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

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

        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, rect.width, rect.height);

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const yGridCount = 4;
        for (let i = 0; i <= yGridCount; i++) {
            const yy = padding.top + (i * (h / yGridCount));
            ctx.moveTo(padding.left, yy);
            ctx.lineTo(padding.left + w, yy);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= yGridCount; i++) {
            const v = Math.round(maxCount - (i * (maxCount / yGridCount)));
            const yy = padding.top + (i * (h / yGridCount));
            ctx.fillText(String(v), padding.left - 8, yy);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const tickCount = 5;
        ctx.fillStyle = "rgba(255,255,255,0.45)";

        for (let i = 0; i <= tickCount; i++) {
            const tt = t0 + (i * (windowMs / tickCount));
            const x = padding.left + (i * (w / tickCount));
            const d = new Date(tt);
            const label = `${String(d.getHours()).padStart(2, "0")}:${String(
                d.getMinutes()
            ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
            ctx.fillText(label, x, rect.height - padding.bottom + 4);
        }

        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const x = padding.left + ((p.t - t0) / windowMs) * w;
            const y = padding.top + h - (p.count / maxCount) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#C084FC";
        ctx.stroke();

        ctx.lineTo(padding.left + w, padding.top + h);
        ctx.lineTo(padding.left, padding.top + h);
        ctx.closePath();
        ctx.fillStyle = "rgba(192,132,252,0.12)";
        ctx.fill();

        const curCount = counts[counts.length - 1] ?? 0;
        const badge = `Total: ${curCount}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "13px Inter, sans-serif";
        ctx.fillText(badge, padding.left, padding.top - 2);
    };

    useEffect(() => {
        const loop = () => {
            draw();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [events]);

    useEffect(() => {
        const onResize = () => draw();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div className="graph-container">
            <canvas ref={canvasRef} className="ratings-canvas" />
        </div>
    );
}
