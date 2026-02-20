"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { Mic } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("General Practice");
  const [credentials, setCredentials] = useState("MD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("providers").insert({
        name,
        email,
        specialty,
        credentials,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="text-center border-b-0 pb-0">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-600 text-white">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold">MedScribe</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-500 mt-1">Set up your provider profile</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
            <Input
              type="text"
              placeholder="Dr. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
            <Input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Specialty</label>
              <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="General Practice">General Practice</option>
                <option value="Family Medicine">Family Medicine</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Surgery">Surgery</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Occupational Medicine">Occupational Medicine</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Credentials</label>
              <Select value={credentials} onChange={(e) => setCredentials(e.target.value)}>
                <option value="MD">MD</option>
                <option value="DO">DO</option>
                <option value="NP">NP</option>
                <option value="PA">PA</option>
                <option value="PA-C">PA-C</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <p className="text-sm text-center text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
