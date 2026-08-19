"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Chat = {
  id: string;
  title: string;
};

type SidebarProps = {
  userEmail: string;
  logout: () => void;
  chats?: Chat[];
  onDeleteChat?: (chatId: string) => void;
};

export default function Sidebar({
  userEmail,
  logout,
  chats = [],
  onDeleteChat,
}: SidebarProps) {
  const router = useRouter();

  const [localChats, setLocalChats] = useState<Chat[]>(chats);

  const handleNewChat = () => {
    router.push("/");
  };

  const handleDelete = (chatId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?"
    );

    if (!confirmed) return;

    // Parent se delete function mila hai to use call karo
    if (onDeleteChat) {
      onDeleteChat(chatId);
    }

    // Sidebar ki local list bhi update karo
    setLocalChats((previous) =>
      previous.filter((chat) => chat.id !== chatId)
    );
  };

  return (
    <aside className="flex h-full w-80 flex-col border-r border-white/10 bg-black p-5 text-white">

      {/* Logo / Heading */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          ✦ PRAKRITI RETURNS!
        </h1>

        <p className="mt-1 text-sm text-white/40">
          Your personal AI assistant
        </p>
      </div>

      {/* New Chat */}
      <button
        type="button"
        onClick={handleNewChat}
        className="mt-6 rounded-xl border border-white/10 py-3 font-medium transition hover:bg-white/10"
      >
        + New Chat
      </button>

      {/* Recent Chats */}
      <div className="mt-8 flex-1 overflow-y-auto">
        <p className="text-xs uppercase text-white/40">
          Recent Chats
        </p>

        {localChats.length === 0 ? (
          <p className="mt-4 text-sm text-white/30">
            No chats yet...
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {localChats.map((chat) => (
              <div
                key={chat.id}
                className="group flex items-center gap-2 rounded-xl px-3 py-3 transition hover:bg-white/10"
              >
                {/* Chat title */}
                <button
                  type="button"
                  onClick={() => router.push(`/?chat=${chat.id}`)}
                  className="min-w-0 flex-1 truncate text-left text-sm text-white/80"
                  title={chat.title}
                >
                  {chat.title}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(chat.id)}
                  className="rounded-lg px-2 py-1 text-white/30 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                  title="Delete chat"
                  aria-label={`Delete ${chat.title}`}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="border-t border-white/10 pt-4">
        <p
          className="truncate text-sm text-white/70"
          title={userEmail}
        >
          {userEmail}
        </p>

        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded-lg border border-white/10 py-2 transition hover:bg-white/10"
        >
          Logout
        </button>
      </div>

    </aside>
  );
}