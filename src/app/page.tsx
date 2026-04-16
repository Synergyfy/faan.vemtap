"use client";

import Image from "next/image";
import styles from "./Login.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useAuth";
import { AxiosError } from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    loginMutation.mutate({ email, password }, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (err: any) => {
        const axiosErr = err as AxiosError;
        const data = axiosErr.response?.data as any;
        const message = data?.error?.message || data?.message || "Invalid credentials. Please try again.";
        setError(Array.isArray(message) ? message[0] : message);
      }
    });
  };

  return (
    <div className={styles.loginContainer}>
      <main className={styles.loginCard}>
        <div className={styles.header}>
          <Image
            src="/Faan.logo_.png"
            alt="FAAN Logo"
            width={160}
            height={80}
            className={styles.logo}
            priority
          />
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>FAAN Passenger Engagement System</h1>
            <p className={styles.subtitle}>Secure Access Portal</p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Authenticating..." : "Login"}
          </button>
        </form>
      </main>

      <footer className={styles.footer}>
        <p className={styles.poweredBy}>
          Powered by <span className={styles.vemtap}>VEMTAP</span>
        </p>
      </footer>
    </div>
  );
}
