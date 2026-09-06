'use client';

import React, { useState, useEffect } from 'react';
import { Quiz } from '@/types';
import { ContentService } from '@/lib/content';
import { Award, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz>>({});

  const refreshData = () => {
    setQuizzes(ContentService.getQuizzes());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz?.title || !editingQuiz?.questions?.length) return;

    const quizToSave: Quiz = {
      id: editingQuiz.id || `quiz-${Date.now()}`,
      title: editingQuiz.title,
      description: editingQuiz.description || '',
      passingScore: editingQuiz.passingScore || 70,
      questions: editingQuiz.questions
    };

    ContentService.saveQuiz(quizToSave);
    refreshData();
    setIsModalOpen(false);
    setEditingQuiz({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      ContentService.deleteQuiz(id);
      refreshData();
    }
  };

  const addQuestion = () => {
    const questions = editingQuiz.questions || [];
    questions.push({
      id: `q-${Date.now()}`,
      question: 'New Question Title?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswerIndex: 0,
      explanation: 'Detailed explanation of why this answer is correct.'
    });
    setEditingQuiz({ ...editingQuiz, questions: [...questions] });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-600" /> Quiz Builder & Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">Design question banks, option choices, and explanations.</p>
        </div>

        <button
          onClick={() => {
            setEditingQuiz({
              title: '',
              description: '',
              passingScore: 75,
              questions: [
                {
                  id: `q-${Date.now()}`,
                  question: 'Sample Question Title?',
                  options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                  correctAnswerIndex: 0,
                  explanation: 'Explanation text here.'
                }
              ]
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Create New Quiz
        </button>
      </div>

      {/* QUIZ TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-4">Quiz Title</th>
                <th className="p-4">Questions</th>
                <th className="p-4">Pass Score</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quizzes.map(qz => (
                <tr key={qz.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">
                    <div>{qz.title}</div>
                    <div className="text-[10px] text-slate-500">id: {qz.id}</div>
                  </td>
                  <td className="p-4 text-amber-700 font-semibold">{qz.questions.length} Items</td>
                  <td className="p-4 text-emerald-600 font-medium">{qz.passingScore}%</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingQuiz(qz);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(qz.id)}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingQuiz?.id ? 'Edit Quiz' : 'Create Quiz'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={editingQuiz?.title || ''}
                  onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  placeholder="e.g. Memory & Execution Quiz"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Passing Score (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={editingQuiz?.passingScore || 70}
                    onChange={e => setEditingQuiz({ ...editingQuiz, passingScore: parseInt(e.target.value) || 70 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Description</label>
                  <input
                    type="text"
                    value={editingQuiz?.description || ''}
                    onChange={e => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              {/* QUESTIONS BUILDER */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Questions ({editingQuiz.questions?.length || 0})</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {editingQuiz.questions?.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700">Question {qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingQuiz.questions?.filter((_, i) => i !== qIdx);
                          setEditingQuiz({ ...editingQuiz, questions: updated });
                        }}
                        className="text-slate-500 hover:text-rose-600 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={e => {
                        const updated = [...(editingQuiz.questions || [])];
                        updated[qIdx].question = e.target.value;
                        setEditingQuiz({ ...editingQuiz, questions: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium"
                    />

                    {/* OPTIONS */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] text-slate-500 font-medium">Options (Select radio for correct answer):</span>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctAnswerIndex === oIdx}
                            onChange={() => {
                              const updated = [...(editingQuiz.questions || [])];
                              updated[qIdx].correctAnswerIndex = oIdx;
                              setEditingQuiz({ ...editingQuiz, questions: updated });
                            }}
                            className="text-blue-600 focus:ring-0"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const updated = [...(editingQuiz.questions || [])];
                              updated[qIdx].options[oIdx] = e.target.value;
                              setEditingQuiz({ ...editingQuiz, questions: updated });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="text-[11px] text-slate-500 font-medium">Explanation</label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={e => {
                          const updated = [...(editingQuiz.questions || [])];
                          updated[qIdx].explanation = e.target.value;
                          setEditingQuiz({ ...editingQuiz, questions: updated });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  Save Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

