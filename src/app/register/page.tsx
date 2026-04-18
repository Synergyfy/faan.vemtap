"use client";

import Image from "next/image";
import styles from "../Login.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useAuth";
import { AxiosError } from "axios";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const registerMutation = useRegister();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const searchParams = new URLSearchParams(window.location.search);
    const callbackUrl = searchParams.get('callbackUrl') || "/dashboard";

    registerMutation.mutate(formData, {
      onSuccess: () => {
        router.push(callbackUrl);
      },
      onError: (err: any) => {
        const axiosErr = err as AxiosError;
        const data = axiosErr.response?.data as any;
        const message = data?.error?.message || data?.message || "Registration failed. Please try again.";
        setError(Array.isArray(message) ? message[0] : message);
      }
    });
  };

  return (
    <div className={styles.loginContainer}>
      <main className={`${styles.loginCard} ${styles.animateIn}`} style={{ maxWidth: '500px' }}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <Image
            src="/Faan.logo_.png"
            alt="FAAN Logo"
            width={120}
            height={60}
            className={styles.logo}
            priority
          />
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Create Passenger Account</h1>
            <p className={styles.subtitle}>Join the Engagement Portal</p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName" className={styles.label}>First Name</label>
              <input
                type="text"
                id="firstName"
                placeholder="John"
                className={styles.input}
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName" className={styles.label}>Last Name</label>
              <input
                type="text"
                id="lastName"
                placeholder="Doe"
                className={styles.input}
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              className={styles.input}
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              placeholder="+234..."
              className={styles.input}
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Min. 8 characters"
                className={`${styles.input} ${styles.inputPassword}`}
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={8}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className={styles.button} disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Already have an account? <Link href="/" style={{ color: '#157347', fontWeight: '600' }}>Login here</Link>
        </p>
      </main>

      <footer className={styles.footer} style={{ position: 'relative', marginTop: '40px', bottom: 'auto' }}>
        <p className={styles.poweredBy}>
          Powered by <span className={styles.vemtap}>VEMTAP</span>
        </p>
      </footer>
    </div>
  );
}
