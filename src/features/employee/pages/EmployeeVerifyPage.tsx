import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EmployeeVerifyPage() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const shopName = params.get("shop_name");
  const verified = status === "success";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center space-y-6">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${verified ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
          {verified ? <CheckCircle2 size={34} /> : <XCircle size={34} />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">
            {verified ? "Employee verified" : "Verification failed"}
          </h1>
          <p className="text-sm font-medium text-slate-500 leading-6">
            {verified
              ? "Your employee invitation has been accepted. You can now sign in and select the shop."
              : "This verification link is invalid or expired. Ask the shop owner to send a new verification email."}
          </p>
        </div>

        {verified && (
          <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-4 text-center space-y-2">
            {shopName && <p className="text-sm font-bold text-slate-700">Shop: {shopName}</p>}
            <p className="text-sm font-medium text-slate-600">Your login credentials will be sent to your email shortly.</p>
          </div>
        )}

        <Link
          to="/login"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-black text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
