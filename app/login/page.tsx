import { loginAction } from "../actions";

export default function Login({
  searchParams,
}: {
  searchParams: { logout?: string; error?: string };
}) {
  return (
    <main className="login-shell">
      <div className="auth-card">
        <div className="auth-logo">SP</div>
        <h1>Welcome back</h1>
        <p className="subtle">
          Sign in to SplitWise Pro and review shared flatmate expenses.
        </p>
        {searchParams.error && <p className="badge err">Invalid login</p>}
        <form
          action={loginAction}
          style={{ display: "grid", gap: 14, marginTop: 22 }}
        >
          <label>
            <span className="subtle">Email</span>
            <input name="email" defaultValue="admin@example.com" />
          </label>
          <label>
            <span className="subtle">Password</span>
            <input name="password" type="password" defaultValue="password" />
          </label>
          <button>Login</button>
        </form>
        <p className="subtle">Demo: admin@example.com / password</p>
      </div>
    </main>
  );
}
