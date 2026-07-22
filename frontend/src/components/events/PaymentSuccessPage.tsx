import { useNavigate } from "react-router-dom";

export function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-accent2-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-accent2-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-charcoal-900">
        Registration Confirmed!
      </h1>
      <p className="text-charcoal-500">
        Your payment was successful and you're registered for the event. You'll
        see it in your registrations list.
      </p>

      <div className="flex gap-3 justify-center pt-4">
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Browse Events
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="bg-white border border-charcoal-200 text-charcoal-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-charcoal-50 transition-colors"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
