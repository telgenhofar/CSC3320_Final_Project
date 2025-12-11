"use client";
import { useState } from "react";
import "./LoginComponent.css";

type LoginComponentProps = {
    onLogin: (id: string) => void;
}

export default function LoginComponent({ onLogin }: LoginComponentProps) {
    const [name, setName] = useState("");

    const login = async () => {
        const res = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ username: name})
        });

        const data = await res.json();
        localStorage.setItem("userId", data.userId);
        onLogin(data.userId);
    }

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h2 className="login-prompt">Enter your name</h2>
                <input className="login-input" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
                <button className="login-button" onClick={login}>Login</button>
            </div>
        </div>
    );
}