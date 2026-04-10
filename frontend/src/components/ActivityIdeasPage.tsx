import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getActivityIdeas,
  createActivityIdea,
  updateActivityIdea,
  deleteActivityIdea,
  type ActivityIdeaDto,
} from "../services/api";

export function ActivityIdeasPage() {
  const [ideas, setIdeas] = useState<ActivityIdeaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadIdeas = () => {
    setLoading(true);
    getActivityIdeas()
      .then(setIdeas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setError(null);
  };

  const startEdit = (idea: ActivityIdeaDto) => {
    setEditingId(idea.id);
    setName(idea.name);
    setDescription(idea.description);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateActivityIdea(editingId, { name, description });
      } else {
        await createActivityIdea({ name, description });
      }
      resetForm();
      loadIdeas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this activity idea?")) return;
    try {
      await deleteActivityIdea(id);
      loadIdeas();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/dashboard"
          className="inline-block text-sm text-primary-400 hover:text-primary-300"
        >
          ← Dashboard
        </Link>

        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-cream-50">
            Activity Ideas
          </h1>
          {!formOpen && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              + New idea
            </button>
          )}
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-cream-50 rounded-2xl border border-charcoal-200 p-6 shadow-lg space-y-4"
          >
            <h2 className="text-lg font-semibold text-charcoal-900">
              {editingId ? "Edit idea" : "New idea"}
            </h2>
            <div>
              <label
                htmlFor="idea-name"
                className="block text-sm font-medium text-charcoal-700 mb-1"
              >
                Name
              </label>
              <input
                id="idea-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="w-full rounded-lg border border-charcoal-300 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="idea-desc"
                className="block text-sm font-medium text-charcoal-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="idea-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                required
                className="w-full rounded-lg border border-charcoal-300 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-white border border-charcoal-300 text-charcoal-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-charcoal-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-cream-50 text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="bg-cream-50 rounded-xl border border-charcoal-200 p-4 flex items-start justify-between gap-4 shadow"
              >
                <div>
                  <p className="font-semibold text-charcoal-900">{idea.name}</p>
                  <p className="text-sm text-charcoal-600 mt-1">
                    {idea.description}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(idea)}
                    className="text-xs text-primary-600 hover:text-primary-700 underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idea.id)}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {ideas.length === 0 && (
              <p className="text-cream-50/60 text-center py-8">
                No activity ideas yet. Create one above.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
