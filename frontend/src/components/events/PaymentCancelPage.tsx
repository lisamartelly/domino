import { useNavigate } from "react-router-dom";

export function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-charcoal-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-charcoal-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-charcoal-900">
        Payment Cancelled
      </h1>
      <p className="text-charcoal-500">
        Your payment was not completed. You can try registering again anytime.
      </p>

      <div className="flex gap-3 justify-center pt-4">
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Back to Events
        </button>
      </div>
    </div>
  );
}
