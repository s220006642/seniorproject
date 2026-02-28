import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function Register() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("customer"); // customer | vendor
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        role,
        email,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(cred.user);

      setMsg("تم إنشاء الحساب. تم إرسال رابط تحقق إلى بريدك الإلكتروني.");
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Create account</h1>

        {msg && <div className="p-3 rounded bg-green-50 text-green-700 text-sm">{msg}</div>}
        {err && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>}

        <div>
          <label className="text-sm">Name</label>
          <input className="mt-1 w-full border rounded-xl p-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="text-sm">Role</label>
          <select className="mt-1 w-full border rounded-xl p-2" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Email</label>
          <input className="mt-1 w-full border rounded-xl p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input className="mt-1 w-full border rounded-xl p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="w-full bg-black text-white rounded-xl p-2">Register</button>
      </form>
    </div>
  );
}