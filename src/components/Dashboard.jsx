"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { LogOut, Plus, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

// Subcomponents
const BookmarkItem = ({ item, onDelete }) => {
  return (
    <div className="group relative bg-[var(--card-bg)] p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] border border-gray-100 dark:border-gray-700 animate-slide-up flex flex-col justify-between h-32">
      <div>
        <h3
          className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate"
          title={item.title}
        >
          {item.title}
        </h3>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 truncate"
          title={item.url}
        >
          <ExternalLink size={14} className="flex-shrink-0" />
          <span className="truncate">{item.url}</span>
        </a>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="absolute bottom-3 right-3 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete bookmark"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default function Dashboard({ user, initialBookmarks }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          setBookmarks((prev) => [...prev, payload.new]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotification = (msg, type) => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/");
  };

  const addBookmark = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      showNotification("Title and URL are required", "error");
      return;
    }

    // URL Validation
    try {
      new URL(url);
    } catch {
      showNotification(
        "Invalid URL format (e.g., https://google.com)",
        "error",
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    if (error) {
      showNotification(error.message, "error");
    } else {
      showNotification("Bookmark added!", "success");
      setTitle("");
      setUrl("");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      showNotification(error.message, "error");
    } else {
      showNotification("Bookmark deleted", "success");
    }
  };

  // Display user info
  const avatarUrl = user.user_metadata.avatar_url;
  const userName =
    user.user_metadata.full_name || user.user_metadata.name || user.email;

  return (
    <div className="min-h-screen p-6 md:p-12 transition-colors duration-300 animate-fade-in">
      {/* Navbar / Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 text-white flex items-center justify-center font-bold text-lg">
              {userName?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              {userName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm border-gray-200 dark:border-gray-700 border"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add Form */}
        <div
          className="lg:col-span-1 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="glass dark:glass-dark p-6 rounded-2xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="text-blue-500" /> New Bookmark
            </h3>

            <form onSubmit={addBookmark} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 dark:text-white placeholder:text-gray-400"
                  placeholder="e.g. My Portfolio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 dark:text-white placeholder:text-gray-400"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin text-xl">◌</span>
                ) : (
                  <Plus size={20} />
                )}
                Add Bookmark
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white px-2">
            Your Collection
          </h3>

          {bookmarks.length === 0 ? (
            <div className="text-center py-20 opacity-70 animate-fade-in">
              <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <ExternalLink size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No bookmarks yet.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Add your first one to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  item={bookmark}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up z-50 text-white font-medium ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {notification.type === "success" ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          )}
          {notification.message}
        </div>
      )}
    </div>
  );
}
