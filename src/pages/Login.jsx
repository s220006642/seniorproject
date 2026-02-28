import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

const navigate = useNavigate();

try {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  if (!cred.user.emailVerified) {
    setMsg("تم تسجيل الدخول، لكن بريدك لم يتم التحقق منه. تحقق من بريدك ثم أعد المحاولة.");
  } else {
    navigate("/");
  }
} catch (error) {
  setErr(error.message);
}

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>

        {msg && <div className="p-3 rounded bg-blue-50 text-blue-700 text-sm">{msg}</div>}
        {err && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>}

        <div>
          <label className="text-sm">Email</label>
          <input className="mt-1 w-full border rounded-xl p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input className="mt-1 w-full border rounded-xl p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="w-full bg-black text-white rounded-xl p-2">Login</button>
      </form>
    </div>
  );
}