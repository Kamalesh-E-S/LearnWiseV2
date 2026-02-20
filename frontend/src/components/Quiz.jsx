import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      try {
        const res = await api.post('/quizzes/generate', {
          roadmap_id: roadmapId,
          node_id: node.data.varName,
          topic: node.data.label
        });
        if (res.data && res.data.quiz) {
          setQuiz(res.data.quiz);
        }
      } catch (err) {
        console.error('Failed to fetch quiz', err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [roadmapId, node]);

  const selectOption = (qIndex, optionIndex) => {
    setAnswers((a) => ({ ...a, [qIndex]: optionIndex }));
  };

  const goNext = () => {
    if (!quiz || !quiz.questions) return;
    if (current < quiz.questions.length - 1) setCurrent(current + 1);
  };

  const goPrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleFinish = async () => {
    if (!quiz || !quiz.questions) return;
    const total = quiz.questions.length;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.answer_index) correct += 1;
    });

    setFinished(true);
    setSubmitting(true);

    // Submit results to backend
    try {
      const payload = {
        roadmap_id: roadmapId,
        node_id: node.data.varName,
        score: correct,
        total: total,
        answers: answers
      };
      console.log('[quiz] submit payload', payload);
      const res = await api.post('/quizzes/submit', payload);
      console.log('[quiz] submit response', res);
      if (res && res.data && res.data.success) {
        const r = { passed: res.data.passed, score: correct, total, attempt_id: res.data.attempt_id };
        setResult(r);
        setSubmitError(null);
        if (onSuccess) onSuccess(r);
      } else {
        const r = { passed: (correct / total) >= 0.8, score: correct, total };
        setResult(r);
        setSubmitError(res?.data?.detail || res?.data?.error || 'Submission failed');
        if (onSuccess) onSuccess(r);
      }
    } catch (err) {
      console.error('Failed to submit quiz results', err);
      setSubmitError(err?.response?.data?.detail || err.message || 'Network error');
      setResult({ passed: (correct / total) >= 0.8, score: correct, total });
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrent(0);
    setFinished(false);
    setResult(null);
  };

  // UI
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Quiz: {node.data.label}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">Close</button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p className="text-sm text-gray-600">Generating quiz...</p>
          </div>
        )}

        {!loading && !quiz && <p className="text-sm text-gray-500">No quiz available.</p>}

        {quiz && quiz.questions && (
          <div>
            {!finished ? (
              <div>
                <div className="mb-2 text-sm text-gray-600">Question {current + 1} of {quiz.questions.length}</div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium text-lg">{quiz.questions[current].question}</p>
                  <div className="mt-3 space-y-3">
                    {quiz.questions[current].options.map((opt, oi) => (
                      <label key={oi} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${answers[current] === oi ? 'bg-blue-50' : ''}`}>
                        <input type="radio" name={`q-${current}`} checked={answers[current] === oi} onChange={() => selectOption(current, oi)} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <button onClick={goPrev} disabled={current===0} className="px-3 py-2 mr-2 rounded bg-gray-100 disabled:opacity-50">Previous</button>
                    {current < quiz.questions.length - 1 ? (
                      <button onClick={goNext} disabled={answers[current] === undefined} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Next</button>
                    ) : (
                      <button onClick={handleFinish} disabled={answers[current] === undefined || submitting} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Finish'}</button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Select an answer to continue</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-4 bg-gray-50 rounded mb-4">
                  <div className="text-lg font-medium">Result</div>
                  <div className="mt-2">Score: <strong>{result?.score}/{result?.total}</strong></div>
                  <div className={`mt-1 ${result?.passed ? 'text-green-600' : 'text-red-600'}`}>{result?.passed ? 'Passed' : 'Failed'} (Passing >= 80%)</div>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-auto">
                  {quiz.questions.map((q, i) => (
                    <div key={i} className="p-3 border rounded">
                      <p className="font-medium">{i + 1}. {q.question}</p>
                      <div className="mt-2">
                        <p>Your answer: <strong>{answers[i] !== undefined ? q.options[answers[i]] : 'No answer'}</strong></p>
                        <p>Correct answer: <strong>{q.options[q.answer_index]}</strong></p>
                        {q.explanation && <p className="text-sm text-gray-600 mt-1">{q.explanation}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={restart} className="px-3 py-2 rounded bg-gray-100">Retake</button>
                  <button onClick={onClose} className="px-3 py-2 rounded bg-blue-600 text-white">Close</button>
                </div>
                {submitError && (
                  <div className="mt-3 text-sm text-red-600">Submission error: {submitError}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
  if (modalRoot) return createPortal(modalContent, modalRoot);
  return modalContent;
}
