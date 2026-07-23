import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { RegisterRequest } from "../services/api";

const LOOKING_FOR_OPTIONS = [
  { value: "closeFriends", label: "Close Friends" },
  { value: "romance", label: "Romance" },
  { value: "community", label: "Community" },
  { value: "hobbies", label: "Hobbies" },
] as const;

export function RegisterForm() {
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    name: "",
    pronouns: "",
    birthday: "",
    phone: "",
    interests: "",
    lookingFor: [],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      lookingFor: checked
        ? [...prev.lookingFor, value]
        : prev.lookingFor.filter((item) => item !== value),
    }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (formData.lookingFor.length === 0) {
      setErrors(["Please select at least one option for what you're looking for."]);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const registerError = error as { errors: string[] };
        setErrors(registerError.errors);
      } else {
        setErrors(["An unexpected error occurred. Please try again."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Register Card */}
        <div className="bg-cream-50 rounded-2xl p-8 border-2 border-charcoal-200 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-charcoal-900 mb-2">
              Create Account
            </h1>
            <p className="text-charcoal-600 text-sm">Sign up to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed"
                placeholder="Your name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Pronouns Field */}
            <div>
              <label
                htmlFor="pronouns"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Pronouns
              </label>
              <input
                id="pronouns"
                name="pronouns"
                type="text"
                value={formData.pronouns}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed"
                placeholder="e.g. she/her, he/him, they/them"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Birthday Field */}
            <div>
              <label
                htmlFor="birthday"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Birthday
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed"
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed"
                placeholder="(555) 123-4567"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-charcoal-500">
                Minimum 6 characters
              </p>
            </div>

            {/* Interests Field */}
            <div>
              <label
                htmlFor="interests"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Interests
              </label>
              <textarea
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-charcoal-100 disabled:cursor-not-allowed resize-none"
                placeholder="What are you into? Hobbies, passions, things you love..."
                disabled={isSubmitting}
              />
            </div>

            {/* Looking For Checkboxes */}
            <fieldset>
              <legend className="block text-sm font-medium text-charcoal-700 mb-3">
                I&apos;m looking for...
              </legend>
              <div className="space-y-3">
                {LOOKING_FOR_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={formData.lookingFor.includes(option.value)}
                      onChange={handleCheckboxChange}
                      disabled={isSubmitting}
                      className="w-5 h-5 rounded border-2 border-charcoal-300 text-primary-500 focus:ring-primary-500 focus:ring-2 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-charcoal-700 group-hover:text-charcoal-900 transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {errors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-cream-50 disabled:bg-charcoal-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? "Registering..." : "Sign Up"}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-charcoal-600">
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("switchToLogin"));
              }}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
