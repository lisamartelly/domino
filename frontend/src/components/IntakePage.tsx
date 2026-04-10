import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getSurveyBySlug,
  submitSurveyResponse,
  type SurveyDto,
  type QuestionDto,
  type SubmitAnswerRequest,
} from "../services/api";

type AnswerState = Record<
  number,
  {
    textValue?: string;
    numberValue?: number;
    booleanValue?: boolean;
    selectedOptionIds?: number[];
  }
>;

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: QuestionDto;
  value: AnswerState[number] | undefined;
  onChange: (val: AnswerState[number]) => void;
}) {
  switch (question.questionType) {
    case "Text":
      return (
        <textarea
          value={value?.textValue ?? ""}
          onChange={(e) => onChange({ textValue: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
          placeholder="Type your answer..."
        />
      );

    case "Number":
      return (
        <input
          type="number"
          value={value?.numberValue ?? ""}
          onChange={(e) =>
            onChange({
              numberValue: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-lg text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          placeholder="Enter a number..."
        />
      );

    case "Boolean":
      return (
        <div className="flex gap-4">
          {[
            { label: "Yes", val: true },
            { label: "No", val: false },
          ].map((opt) => (
            <label
              key={String(opt.val)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                value?.booleanValue === opt.val
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-300"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.questionVersionId}`}
                checked={value?.booleanValue === opt.val}
                onChange={() => onChange({ booleanValue: opt.val })}
                className="sr-only"
              />
              <span className="font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case "SingleChoice":
      return (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                value?.selectedOptionIds?.[0] === opt.id
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-300"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.questionVersionId}`}
                checked={value?.selectedOptionIds?.[0] === opt.id}
                onChange={() => onChange({ selectedOptionIds: [opt.id] })}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  value?.selectedOptionIds?.[0] === opt.id
                    ? "border-primary-500"
                    : "border-charcoal-300"
                }`}
              >
                {value?.selectedOptionIds?.[0] === opt.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                )}
              </div>
              <span>{opt.displayValue}</span>
            </label>
          ))}
        </div>
      );

    case "MultipleChoice": {
      const selected = value?.selectedOptionIds ?? [];
      return (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const isChecked = selected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isChecked
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? selected.filter((id) => id !== opt.id)
                      : [...selected, opt.id];
                    onChange({ selectedOptionIds: next });
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isChecked
                      ? "border-primary-500 bg-primary-500"
                      : "border-charcoal-300"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span>{opt.displayValue}</span>
              </label>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

export function IntakePage() {
  const { user, setIntakeCompleted } = useAuth();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<SurveyDto | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSurveyBySlug("intake");
        setSurvey(data);
      } catch {
        setError("Failed to load the intake form. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const buildPayload = (): SubmitAnswerRequest[] => {
    if (!survey) return [];
    const result: SubmitAnswerRequest[] = [];

    for (const q of survey.questions) {
      const a = answers[q.questionVersionId];
      if (!a) continue;

      const qvId = q.questionVersionId;

      switch (q.questionType) {
        case "Text":
          if (a.textValue?.trim()) {
            result.push({ questionVersionId: qvId, textValue: a.textValue });
          }
          break;
        case "Number":
          if (a.numberValue !== undefined) {
            result.push({ questionVersionId: qvId, numberValue: a.numberValue });
          }
          break;
        case "Boolean":
          if (a.booleanValue !== undefined) {
            result.push({ questionVersionId: qvId, booleanValue: a.booleanValue });
          }
          break;
        case "SingleChoice":
        case "MultipleChoice":
          if (a.selectedOptionIds?.length) {
            result.push({ questionVersionId: qvId, selectedOptionIds: a.selectedOptionIds });
          }
          break;
      }
    }

    return result;
  };

  const validate = (): boolean => {
    if (!survey) return false;
    const missing = new Set<number>();
    const payload = buildPayload();
    const answeredIds = new Set(payload.map((a) => a.questionVersionId));

    for (const q of survey.questions) {
      if (q.required && !answeredIds.has(q.questionVersionId)) {
        missing.add(q.questionVersionId);
      }
    }

    setValidationErrors(missing);
    return missing.size === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitSurveyResponse("intake", buildPayload());
      setIntakeCompleted();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center">
        <div className="text-cream-50 text-lg">Loading...</div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
        <div className="bg-cream-50 rounded-2xl p-8 border-2 border-charcoal-200 shadow-2xl max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const groups = survey.questions.reduce<
    { group: string | null; questions: QuestionDto[] }[]
  >((acc, q) => {
    const last = acc[acc.length - 1];
    if (last && last.group === q.questionGroup) {
      last.questions.push(q);
    } else {
      acc.push({ group: q.questionGroup, questions: [q] });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream-50 mb-2">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-charcoal-300">{survey.description}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-cream-50 rounded-2xl p-8 border-2 border-charcoal-200 shadow-2xl space-y-10">
            {groups.map((group, gi) => (
              <div key={gi}>
                {group.group && (
                  <h2 className="text-xl font-bold text-charcoal-900 mb-6 pb-2 border-b-2 border-charcoal-100">
                    {group.group}
                  </h2>
                )}
                <div className="space-y-8">
                  {group.questions.map((q) => (
                    <div key={q.questionVersionId}>
                      <label className="block text-sm font-medium text-charcoal-700 mb-3">
                        {q.prompt}
                        {q.required && (
                          <span className="text-primary-500 ml-1">*</span>
                        )}
                      </label>
                      <QuestionField
                        question={q}
                        value={answers[q.questionVersionId]}
                        onChange={(val) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.questionVersionId]: val,
                          }))
                        }
                      />
                      {validationErrors.has(q.questionVersionId) && (
                        <p className="mt-2 text-sm text-red-600">
                          This field is required.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-cream-50 disabled:bg-charcoal-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? "Submitting..." : "Complete Intake"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
