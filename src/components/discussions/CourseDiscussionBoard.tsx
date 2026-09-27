'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DiscussionThread, DiscussionPost } from '@/types';
import {
  MessageSquare,
  Pin,
  Lock,
  Unlock,
  CheckCircle2,
  Send,
  Edit2,
  Trash2,
  Clock,
  Plus,
  ArrowLeft,
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export default function CourseDiscussionBoard({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId?: string;
}) {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<DiscussionThread | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // New Thread Modal
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [postingReply, setPostingReply] = useState(false);

  // Edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isStaff = profile?.role === 'teacher' || profile?.role === 'admin';

  // Load threads
  const loadThreads = async () => {
    setLoading(true);
    try {
      const url = `/api/discussions?courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setThreads(json.data?.threads || []);
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to load discussion topics.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadThreads();
  }, [courseId, lessonId]);

  // Load posts for selected thread
  const loadThreadPosts = async (thread: DiscussionThread) => {
    setSelectedThread(thread);
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/discussions/threads/${thread.id}`);
      if (res.ok) {
        const json = await res.json();
        setPosts(json.data?.posts || []);
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to load thread responses.' });
    } finally {
      setLoadingPosts(false);
    }
  };

  // Create new thread
  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Title and message body are required.' });
      return;
    }
    setCreatingThread(true);
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          courseId,
          lessonId: lessonId || undefined,
          title: newTitle,
          bodyMd: newBody,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setShowNewThreadModal(false);
        setNewTitle('');
        setNewBody('');
        setFeedbackMsg({ type: 'success', text: 'Discussion thread opened!' });
        await loadThreads();
        if (json.data?.thread) {
          void loadThreadPosts(json.data.thread);
        }
      } else {
        const errJson = await res.json();
        setFeedbackMsg({ type: 'error', text: errJson.error?.message || 'Failed to create thread.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error creating thread.' });
    } finally {
      setCreatingThread(false);
    }
  };

  // Post reply
  const handlePostReply = async () => {
    if (!replyBody.trim() || !selectedThread) return;
    setPostingReply(true);
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/discussions/threads/${selectedThread.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ bodyMd: replyBody }),
      });

      if (res.ok) {
        const json = await res.json();
        setReplyBody('');
        setPosts((prev) => [...prev, json.data.post]);
        setFeedbackMsg({ type: 'success', text: 'Response submitted.' });
      } else {
        const errJson = await res.json();
        setFeedbackMsg({ type: 'error', text: errJson.error?.message || 'Failed to submit response.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error posting reply.' });
    } finally {
      setPostingReply(false);
    }
  };

  // Save edit
  const handleSaveEdit = async (postId: string) => {
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/discussions/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ bodyMd: editBody }),
      });

      if (res.ok) {
        const json = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? json.data.post : p)));
        setEditingPostId(null);
        setFeedbackMsg({ type: 'success', text: 'Post updated.' });
      } else {
        const errJson = await res.json();
        setFeedbackMsg({ type: 'error', text: errJson.error?.message || 'Cannot edit post.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to edit post.' });
    }
  };

  // Soft delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/discussions/posts/${postId}`, {
        method: 'DELETE',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setFeedbackMsg({ type: 'success', text: 'Post removed.' });
      } else {
        const errJson = await res.json();
        setFeedbackMsg({ type: 'error', text: errJson.error?.message || 'Cannot delete post.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to delete post.' });
    }
  };

  // Faculty moderate thread (pin or lock)
  const handleModerateThread = async (action: 'pin' | 'lock', value: boolean) => {
    if (!selectedThread) return;
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/discussions/threads/${selectedThread.id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ action, value }),
      });

      if (res.ok) {
        const json = await res.json();
        setSelectedThread(json.data.thread);
        setThreads((prev) =>
          prev.map((t) => (t.id === selectedThread.id ? json.data.thread : t))
        );
        setFeedbackMsg({
          type: 'success',
          text: `Thread ${action === 'pin' ? (value ? 'pinned' : 'unpinned') : value ? 'locked' : 'unlocked'}.`,
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Moderation failed.' });
    }
  };

  // Faculty mark instructor answer
  const handleMarkInstructorAnswer = async (postId: string, current: boolean) => {
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/discussions/posts/${postId}/instructor-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ isInstructorAnswer: !current }),
      });

      if (res.ok) {
        const json = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? json.data.post : p)));
        setFeedbackMsg({
          type: 'success',
          text: !current ? 'Marked as official instructor answer.' : 'Instructor answer badge removed.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to mark instructor answer.' });
    }
  };

  const isWithin15Minutes = (createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() <= 15 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div
          className={`p-3.5 border flex items-center justify-between text-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-[#e8f5e9] border-[#c8e6c9] text-[#1b5e20]'
              : 'bg-[#ffebee] border-[#ffcdd2] text-[#c62828]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#c62828]" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!selectedThread ? (
        /* THREADS LIST VIEW */
        <div className="bg-white border border-[#d8d0c2] overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 bg-[#fcfbf9] border-b border-[#d8d0c2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="edurah-eyebrow">
                <span /> Collaborative Scholarship
              </p>
              <h2 className="font-serif-heading text-lg sm:text-xl font-normal text-[#171819]">
                Course & Lesson Discussions
              </h2>
            </div>

            <button
              onClick={() => setShowNewThreadModal(true)}
              className="px-4 py-2.5 bg-[#81512f] hover:bg-[#683f23] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Start Discussion Topic
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#555048]">
              Loading academic discussion threads...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#706b63] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#a59e93] mx-auto" />
              <p>No discussion threads opened yet for this course. Start the conversation!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8e2d5]">
              {threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => void loadThreadPosts(t)}
                  className="p-4 sm:p-5 hover:bg-[#fcfbf9] transition-colors cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono-code uppercase px-2 py-0.5 bg-[#f3e5d4] text-[#81512f] border border-[#d8a471]/40">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      {t.locked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono-code uppercase px-2 py-0.5 bg-[#ede8dc] text-[#555048] border border-[#d8d0c2]">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                      <h3 className="font-bold text-xs sm:text-sm text-[#171819] truncate">
                        {t.title}
                      </h3>
                    </div>

                    <p className="text-[11px] text-[#706b63]">
                      Started by <strong>{t.authorName}</strong> ({t.authorRole || 'scholar'}) ·{' '}
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-[#81512f] bg-[#f6f2e9] px-3 py-1.5 border border-[#d8d0c2] text-xs font-mono-code">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.postCount || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ACTIVE THREAD VIEW */
        <div className="bg-white border border-[#d8d0c2] overflow-hidden shadow-sm space-y-6 p-4 sm:p-6">
          {/* TOP NAV & MODERATION BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e8e2d5] gap-4">
            <button
              onClick={() => setSelectedThread(null)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to All Topics
            </button>

            {isStaff && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModerateThread('pin', !selectedThread.pinned)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 cursor-pointer ${
                    selectedThread.pinned
                      ? 'bg-[#81512f] text-white border-[#81512f]'
                      : 'bg-[#fcfbf9] text-[#555048] border-[#d8d0c2] hover:bg-[#ede8dc]'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" /> {selectedThread.pinned ? 'Pinned' : 'Pin Thread'}
                </button>

                <button
                  onClick={() => handleModerateThread('lock', !selectedThread.locked)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 cursor-pointer ${
                    selectedThread.locked
                      ? 'bg-[#c62828] text-white border-[#c62828]'
                      : 'bg-[#fcfbf9] text-[#555048] border-[#d8d0c2] hover:bg-[#ede8dc]'
                  }`}
                >
                  {selectedThread.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {selectedThread.locked ? 'Locked' : 'Lock Thread'}
                </button>
              </div>
            )}
          </div>

          {/* THREAD TITLE & AUTHOR */}
          <div className="space-y-1">
            <h1 className="font-serif-hero text-xl sm:text-2xl text-[#171819]">
              {selectedThread.title}
            </h1>
            <p className="text-xs text-[#706b63]">
              Opened by <strong>{selectedThread.authorName}</strong> ·{' '}
              {new Date(selectedThread.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* POSTS TIMELINE */}
          {loadingPosts ? (
            <div className="p-8 text-center text-xs text-[#555048]">Loading responses...</div>
          ) : (
            <div className="space-y-4">
              {posts.map((p, idx) => {
                const isAuthor = user?.id === p.authorId;
                const canEdit = isStaff || (isAuthor && isWithin15Minutes(p.createdAt));

                return (
                  <div
                    key={p.id}
                    className={`p-4 border transition-all ${
                      p.isInstructorAnswer
                        ? 'bg-[#e8f5e9]/40 border-[#a5d6a7]'
                        : 'bg-[#fcfbf9] border-[#d8d0c2]'
                    }`}
                  >
                    {/* POST HEADER */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#e8e2d5]/60 mb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#171819] text-[#f6f2e9] text-xs font-bold flex items-center justify-center font-mono-code">
                          {p.authorName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#171819]">{p.authorName}</span>
                            <span
                              className={`text-[9px] font-bold font-mono-code uppercase px-1.5 py-0.2 ${
                                p.authorRole === 'teacher' || p.authorRole === 'admin'
                                  ? 'bg-[#f3e5d4] text-[#81512f]'
                                  : 'bg-[#ede8dc] text-[#555048]'
                              }`}
                            >
                              {p.authorRole || 'scholar'}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8a8376] font-mono-code">
                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.isInstructorAnswer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono-code uppercase px-2 py-0.5 bg-[#2e7d32] text-white">
                            <CheckCircle2 className="w-3 h-3" /> Instructor Answer
                          </span>
                        )}

                        {isStaff && (
                          <button
                            onClick={() => handleMarkInstructorAnswer(p.id, p.isInstructorAnswer)}
                            className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] cursor-pointer"
                          >
                            {p.isInstructorAnswer ? 'Unmark Answer' : 'Mark as Answer'}
                          </button>
                        )}

                        {canEdit && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => {
                                setEditingPostId(p.id);
                                setEditBody(p.bodyMd);
                              }}
                              className="p-1 text-[#706b63] hover:text-[#171819] cursor-pointer"
                              title="Edit post (Available for 15 mins)"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(p.id)}
                              className="p-1 text-[#c62828] hover:text-[#b71c1c] cursor-pointer"
                              title="Delete post"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* POST BODY */}
                    {editingPostId === p.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full p-2.5 bg-white border border-[#81512f] text-xs focus:outline-none"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingPostId(null)}
                            className="px-3 py-1 border border-[#d8d0c2] text-xs text-[#555048] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-4 py-1 bg-[#81512f] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#171819] leading-relaxed whitespace-pre-wrap">
                        {p.bodyMd}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* REPLY BOX */}
          {selectedThread.locked && !isStaff ? (
            <div className="p-4 bg-[#ede8dc] text-[#555048] text-xs text-center border border-[#d8d0c2]">
              <Lock className="w-4 h-4 inline-block mr-1.5 text-[#81512f]" />
              This discussion topic has been locked by the instructor. Replies are closed.
            </div>
          ) : (
            <div className="p-4 bg-[#fcfbf9] border border-[#d8d0c2] space-y-3 pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block">
                Post Response
              </span>
              <textarea
                rows={3}
                placeholder="Compose your academic response or clarifying query..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="w-full p-3 bg-white border border-[#d8d0c2] text-xs text-[#171819] focus:outline-none focus:border-[#81512f]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8a8376] font-mono-code">
                  Max 5 responses/min · 15-minute edit window
                </span>
                <button
                  onClick={handlePostReply}
                  disabled={postingReply || !replyBody.trim()}
                  className="px-5 py-2 bg-[#81512f] hover:bg-[#683f23] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Response
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW THREAD MODAL */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] border border-[#d8d0c2] max-w-lg w-full p-6 space-y-4 relative shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#81512f]" />
            <div className="flex items-center justify-between pb-2 border-b border-[#e8e2d5]">
              <h3 className="font-serif-heading text-lg font-normal text-[#171819]">
                Start Academic Discussion Topic
              </h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="text-[#706b63] hover:text-[#171819] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clarification on Transform Fault Shear Vectors"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#d8d0c2] text-xs focus:outline-none focus:border-[#81512f]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] block mb-1">
                  Question or Inquiry Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your reasoning, specific textbook section, or inquiry..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#d8d0c2] text-xs focus:outline-none focus:border-[#81512f]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="px-4 py-2 border border-[#d8d0c2] text-xs font-semibold text-[#555048] hover:bg-[#ede8dc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThread}
                disabled={creatingThread}
                className="px-5 py-2 bg-[#81512f] hover:bg-[#683f23] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Publish Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
