import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import api from '../lib/axios';

export default function Quiz({ roadmapId, node, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchQuiz = async (forceNew = false) => {
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setCurrent(0);
    setFinished(false);
    setResult(null);
    setSubmitError(null);
    try {
      const res = await api.post('/quizzes/generate', {
        roadmap_id: roadmapId,
        node_id: node.data.varName,
        topic: node.data.label,
        force_new: forceNew,
      });
      if (res.data?.quiz) setQuiz(res.data.quiz);
    } catch (err) {
      console.error('Failed to fetch quiz', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuiz(false); }, [roadmapId, node]);

  const selectOption = (qIdx, optIdx) => setAnswers(a => ({ ...a, [qIdx]: optIdx }));
  const goNext = () => { if (quiz && current < quiz.questions.length - 1) setCurrent(current + 1); };
  const goPrev = () => { if (current > 0) setCurrent(current - 1); };

  const handleFinish = async () => {
    if (!quiz?.questions) return;
    const total = quiz.questions.length;
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answer_index).length;

    setFinished(true);
    setSubmitting(true);
    try {
      const res = await api.post('/quizzes/submit', { roadmap_id: roadmapId, node_id: node.data.varName, score: correct, total, answers });
      const r = { passed: res.data?.success ? res.data.passed : correct / total >= 0.8, score: correct, total };
      setResult(r);
      if (onSuccess) onSuccess(r);
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || err.message || 'Network error');
      setResult({ passed: correct / total >= 0.8, score: correct, total });
    } finally {
      setSubmitting(false);
    }
  };

  const pct = quiz?.questions ? Math.round(((current + 1) / quiz.questions.length) * 100) : 0;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-midnight px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">Quiz</p>
            <h3 className="text-white font-bold truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {node.data.label}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
              <p className="text-slate-400 text-sm">Crafting your quiz…</p>
            </div>
          )}

          {!loading && !quiz && (
            <p className="text-center text-slate-400 py-8 text-sm">No quiz available.</p>
          )}

          {/* Question */}
          {quiz?.questions && !finished && (
            <div>
              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Question {current + 1} of {quiz.questions.length}</span>
                  <span className="text-coral font-semibold">{pct}%</span>
                </div>
                <div className="w-full bg-sage rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-coral transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="bg-sage rounded-2xl p-5 mb-5">
                <p className="font-semibold text-midnight leading-relaxed mb-4">{quiz.questions[current].question}</p>
                <div className="space-y-2">
                  {quiz.questions[current].options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${answers[current] === oi
                          ? 'border-coral bg-coral/8 shadow-sm'
                          : 'border-midnight/5 bg-white hover:border-midnight/10'}`}
                      style={answers[current] === oi ? { background: 'rgba(255,127,80,0.07)' } : {}}
                    >
                      <input
                        type="radio"
                        name={`q-${current}`}
                        checked={answers[current] === oi}
                        onChange={() => selectOption(current, oi)}
                        className="accent-coral"
                      />
                      <span className="text-sm text-midnight">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={goPrev} disabled={current === 0}
                  className="px-4 py-2 text-sm rounded-full bg-sage text-midnight hover:bg-sage/80 disabled:opacity-30 transition-colors">
                  ← Prev
                </button>
                {current < quiz.questions.length - 1 ? (
                  <button onClick={goNext} disabled={answers[current] === undefined}
                    className="px-5 py-2 text-sm rounded-full bg-midnight text-white hover:opacity-80 disabled:opacity-30 transition-all">
                    Next →
                  </button>
                ) : (
                  <button onClick={handleFinish} disabled={answers[current] === undefined || submitting}
                    className="px-5 py-2 text-sm rounded-full bg-coral text-white font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-sm">
                    {submitting ? 'Submitting…' : 'Finish ✓'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {finished && result && (
            <div>
              <div className={`rounded-2xl p-6 mb-5 text-center ${result.passed ? 'bg-coral/8' : 'bg-red-50'}`}
                style={result.passed ? { background: 'rgba(255,127,80,0.07)' } : {}}>
                {result.passed ? (
                  <>
                    <CheckCircle className="h-14 w-14 text-coral mx-auto mb-3" />
                    <h4 className="text-2xl font-bold text-midnight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                      🎉 Passed!
                    </h4>
                    <p className="text-slate-500 text-sm">Excellent work. {result.score}/{result.total} correct.</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-14 w-14 text-red-400 mx-auto mb-3" />
                    <h4 className="text-2xl font-bold text-midnight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Not quite yet
                    </h4>
                    <p className="text-slate-500 text-sm">You scored {result.score}/{result.total}. Need 80% to pass.</p>
                  </>
                )}
                <p className="mt-3 text-4xl font-bold text-midnight">{result.score}<span className="text-slate-300">/{result.total}</span></p>
              </div>

              {/* Review */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
                {quiz.questions.map((q, i) => {
                  const userAns = answers[i];
                  const correct = userAns === q.answer_index;
                  return (
                    <div key={i} className={`p-3.5 rounded-xl border text-sm ${correct ? 'border-coral/20 bg-coral/5' : 'border-red-200 bg-red-50'}`}
                      style={correct ? { background: 'rgba(255,127,80,0.05)', borderColor: 'rgba(255,127,80,0.2)' } : {}}>
                      <p className="font-medium text-midnight mb-1">{i + 1}. {q.question}</p>
                      <p className={correct ? 'text-coral' : 'text-red-600'}>
                        Your answer: <strong>{userAns !== undefined ? q.options[userAns] : 'No answer'}</strong>
                        {!correct && <> → <strong className="text-coral">{q.options[q.answer_index]}</strong></>}
                      </p>
                      {q.explanation && <p className="text-slate-400 text-xs mt-1 italic">{q.explanation}</p>}
                    </div>
                  );
                })}
              </div>

              {submitError && <p className="text-xs text-amber-600 mb-3">⚠ {submitError}</p>}

              <div className="flex gap-2 justify-end">
                <button onClick={() => fetchQuiz(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-sage text-midnight hover:bg-sage/80 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" />Retake (new questions)
                </button>
                <button onClick={onClose}
                  className="px-5 py-2 text-sm rounded-full bg-coral text-white font-semibold hover:opacity-90 transition-all shadow-sm">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const rootEl = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
  return rootEl ? createPortal(modal, rootEl) : modal;
}
