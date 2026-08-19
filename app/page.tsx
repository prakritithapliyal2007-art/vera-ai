"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Menu, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import ChatInput from "@/components/ChatInput";
import AIVoice from "@/components/AIVoice";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  title: string;
  created_at: string;
};

export default function Home() {
  const router = useRouter();

  // =========================
  // CHAT / AI STATES
  // =========================

  const abortControllerRef = useRef<AbortController | null>(null);

  const [voiceMode, setVoiceMode] = useState(false);
  const voiceModeRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(null);

  const shouldAutoScrollRef = useRef(true);
  
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const jumpToLatest = () => {
  const container = messagesContainerRef.current;

  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });

  shouldAutoScrollRef.current = true;
  setShowJumpToLatest(false);
};

  // =========================
  // MOBILE SIDEBAR
  // =========================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================
  // DELETE CHAT
  // =========================

  const [deletingChatId, setDeletingChatId] =
    useState<string | null>(null);

  // =========================
  // VOICE STATES
  // =========================

  const [voiceTrigger, setVoiceTrigger] = useState(0);
  const [lastAIResponse, setLastAIResponse] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);

  // =========================
  // FILE UPLOAD
  // =========================

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // =========================
  // USER STATES
  // =========================

  const [userId, setUserId] =
    useState<string | null>(null);

  const [userEmail, setUserEmail] =
    useState<string | null>(null);

  // =========================
  // CHAT HISTORY STATES
  // =========================

  const [chats, setChats] =
    useState<Chat[]>([]);

  const [chatId, setChatId] =
    useState<string | null>(null);

  const [loadingChats, setLoadingChats] =
    useState(false);

  // =========================
  // USER NAME
  // =========================

  const userName = (() => {
    if (!userEmail) {
      return "Guest";
    }

    const emailPart = userEmail.split("@")[0];

    const withoutNumbers =
      emailPart.split(/[0-9]/)[0];

    const firstName =
      withoutNumbers.split(/[._-]/)[0];

    if (!firstName) {
      return "Guest";
    }

    return (
      firstName.charAt(0).toUpperCase() +
      firstName.slice(1).toLowerCase()
    );
  })();

  // =========================
  // AUTO SCROLL
  // =========================

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    const container =
      messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // =========================
  // GET LOGGED-IN USER
  // =========================

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");

        await loadChats(user.id);
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(
            session.user.email || ""
          );

          await loadChats(session.user.id);
        } else {
          setUserId(null);
          setUserEmail("");
          setChats([]);
          setMessages([]);
          setChatId(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // LOAD CHAT HISTORY
  // =========================

  async function loadChats(id: string) {
    setLoadingChats(true);

    const { data, error } = await supabase
      .from("chats")
      .select("id, title, created_at")
      .eq("user_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error loading chats:",
        error
      );
    } else {
      setChats(data || []);
    }

    setLoadingChats(false);
  }

  // =========================
  // DELETE CHAT
  // =========================

  async function handleDeleteChat(
    targetChatId: string
  ) {
    if (!targetChatId) {
      return;
    }

    if (deletingChatId) {
      return;
    }

    setDeletingChatId(targetChatId);

    try {
      // First delete messages belonging
      // to this chat.
      const {
        error: messagesError,
      } = await supabase
        .from("messages")
        .delete()
        .eq("chat_id", targetChatId);

      if (messagesError) {
        throw messagesError;
      }

      // Then delete the chat itself.
      const {
        error: chatError,
      } = await supabase
        .from("chats")
        .delete()
        .eq("id", targetChatId)
        .eq("user_id", userId);

      if (chatError) {
        throw chatError;
      }

      // Immediately remove from UI.
      setChats((previous) =>
        previous.filter(
          (chat) => chat.id !== targetChatId
        )
      );

      // If deleted chat was open,
      // reset current conversation.
      if (chatId === targetChatId) {
        setChatId(null);
        setMessages([]);
        setMessage("");
      }

      console.log(
        "Chat deleted successfully"
      );
    } catch (error) {
      console.error(
        "Delete chat error:",
        error
      );
    } finally {
      setDeletingChatId(null);
    }
  }

  // =========================
  // OPEN OLD CHAT
  // =========================

  async function openChat(id: string) {
    if (deletingChatId) {
      return;
    }

    setChatId(id);
    setMessages([]);
    setSidebarOpen(false);

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", id)
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error loading messages:",
        error
      );
      return;
    }

    setMessages(
      (data || []).map((msg) => ({
        role:
          msg.role as
          | "user"
          | "assistant",
        content: msg.content,
      }))
    );
  }

  // =========================
  // NEW CHAT
  // =========================

  function newChat() {
    // Stop any active AI response.
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // Stop voice.
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();

    setLoading(false);
    setIsThinking(false);
    setIsListening(false);

    setChatId(null);
    setMessages([]);
    setMessage("");
    setSelectedFile(null);

    setSidebarOpen(false);
  }

  // =========================
  // LOGOUT
  // =========================

  async function logout() {
    abortControllerRef.current?.abort();
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();

    await supabase.auth.signOut();

    setUserId(null);
    setUserEmail("");
    setChats([]);
    setMessages([]);
    setChatId(null);

    router.push("/login");
  }

  // =========================
  // STOP AI RESPONSE
  // =========================

  function handleStop() {
    abortControllerRef.current?.abort();

    abortControllerRef.current = null;

    window.speechSynthesis?.cancel();

    setLoading(false);
    setIsThinking(false);
  }

  // =========================
  // VOICE MODE
  // =========================

  function toggleVoiceMode() {
    const newValue = !voiceMode;

    setVoiceMode(newValue);
    voiceModeRef.current = newValue;

    if (!newValue) {
      recognitionRef.current?.stop();

      window.speechSynthesis.cancel();

      setIsListening(false);
    } else {
      startVoiceConversation();
    }
  }

  // =========================
  // START VOICE
  // =========================

  function startVoiceConversation() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice conversation is not supported in this browser."
      );
      return;
    }

    if (isListening) {
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);

      console.log(
        "🎙️ VERA is listening..."
      );
    };

    recognition.onresult = async (
      event: any
    ) => {
      const transcript =
        event.results[0][0]
          .transcript;

      console.log(
        "You said:",
        transcript
      );

      setIsListening(false);

      await askVera(transcript);
    };

    recognition.onerror = (
      event: any
    ) => {
      console.error(
        "Voice conversation error:",
        event.error
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current =
      recognition;

    recognition.start();
  }

  // =========================
  // FILE SELECT
  // =========================

  function handleFileSelect(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (
      event.target.files &&
      event.target.files.length > 0
    ) {
      setSelectedFile(
        event.target.files[0]
      );
    }
  }

  // =========================
  // AI VOICE OUTPUT
  // =========================

  function speakVera(text: string) {
    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(
      utterance
    );
  }

  // =========================
  // ASK Vera
  // =========================

  async function askVera(
    voiceText?: string
  ) {
    const rawMessage =
      typeof voiceText === "string"
        ? voiceText
        : typeof message === "string"
          ? message
          : "";

    const currentMessage =
      rawMessage.trim();

    // FILE SUPPORT:
    // Allow sending even when there is
    // no typed message, as long as a file
    // has been selected.
    if (
      !currentMessage &&
      !selectedFile
    ) {
      return;
    }

    if (loading) {
      return;
    }

    if (!userId) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setIsThinking(true);

    // If only a file was selected and no
    // text was typed, create a useful
    // message for VERA.
    const finalUserMessage =
      currentMessage ||
      `Please analyze the attached file: ${selectedFile?.name}`;

    const userMessage: Message = {
      role: "user",
      content: finalUserMessage,
    };

    function jumpToLatest() {
      const container =
        messagesContainerRef.current;

      if (!container) {
        return;
      }

      shouldAutoScrollRef.current = true;

      setShowJumpToLatest(false);

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }

    try {
      // =========================
      // CREATE CHAT IF NEEDED
      // =========================

      let currentChatId = chatId;

      if (!currentChatId) {
        const {
          data: newChat,
          error: chatError,
        } = await supabase
          .from("chats")
          .insert({
            user_id: userId,
            title:
              finalUserMessage.length >
                40
                ? finalUserMessage.slice(
                  0,
                  40
                ) + "..."
                : finalUserMessage,
          })
          .select()
          .single();

        if (chatError) {
          throw chatError;
        }

        currentChatId =
          newChat.id;

        setChatId(
          currentChatId
        );

        await loadChats(
          userId
        );
      }

      // =========================
      // SAVE USER MESSAGE
      // =========================

      const {
        error:
        userMessageError,
      } = await supabase
        .from("messages")
        .insert({
          chat_id:
            currentChatId,
          user_id: userId,
          role: "user",
          content:
            finalUserMessage,
        });

      if (userMessageError) {
        throw userMessageError;
      }

      const updatedMessages =
        [
          ...messages,
          userMessage,
        ];

      setMessages(
        updatedMessages
      );

      setMessage("");

      // =========================
      // SEND MESSAGE + FILE
      // =========================

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      const formData =
        new FormData();

      formData.append(
        "messages",
        JSON.stringify(
          updatedMessages
        )
      );

      // ACTUAL FILE IS SENT HERE
      if (selectedFile) {
        formData.append(
          "file",
          selectedFile
        );
      }

      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",

            // IMPORTANT:
            // Do NOT manually set
            // Content-Type here.
            // Browser automatically sets
            // multipart/form-data boundary.
            body: formData,

            signal:
              controller.signal,
          }
        );

      // File has now been passed
      // to the API.
      setSelectedFile(null);

      if (!response.ok) {
        let errorMessage =
          "Something went wrong";

        try {
          const data =
            await response.json();

          errorMessage =
            data.error ||
            errorMessage;
        } catch {
          // Ignore JSON parsing error.
        }

        throw new Error(
          errorMessage
        );
      }

      if (!response.body) {
        throw new Error(
          "No response stream received."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantText = "";

      // Show empty assistant
      // message immediately.
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "",
        },
      ]);

      // =========================
      // READ STREAM
      // =========================

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        assistantText += chunk;

        if (
          assistantText.length >
          0
        ) {
          setIsThinking(false);
        }

        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content:
              assistantText,
          },
        ]);
      }

      // Flush remaining decoder data.
      assistantText +=
        decoder.decode();

      // =========================
      // SAVE AI RESPONSE
      // =========================

      if (
        assistantText.trim()
      ) {
        const {
          error:
          assistantMessageError,
        } = await supabase
          .from("messages")
          .insert({
            chat_id:
              currentChatId,
            user_id: userId,
            role: "assistant",
            content:
              assistantText,
          });

        if (
          assistantMessageError
        ) {
          console.error(
            "Error saving AI response:",
            assistantMessageError
          );
        }
      }

      // =========================
      // VOICE OUTPUT
      // =========================

      if (
        voiceModeRef.current &&
        assistantText
      ) {
        speakVera(
          assistantText
        );
      }

      setLastAIResponse(
        assistantText
      );

      setVoiceTrigger(
        (previous) =>
          previous + 1
      );

      // Refresh sidebar.
      await loadChats(userId);
    } catch (error) {
      // =========================
      // STOPPED BY USER
      // =========================

      if (
        error instanceof
        DOMException &&
        error.name ===
        "AbortError"
      ) {
        console.log(
          "VERA generation stopped"
        );

        return;
      }

      // =========================
      // ERROR
      // =========================

      console.error(
        "VERA  Error:",
        error
      );

      setIsThinking(false);

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content:
              "Sorry, VERA couldn't respond right now.",
          },
        ]
      );
    } finally {
      abortControllerRef.current =
        null;

      setLoading(false);
      setIsThinking(false);
    }
  }
  

  // =========================
  // PAGE UI
  // =========================
  const clearSelectedFile = () => {
    setSelectedFile(null);
  };
  return (
    <main className="flex min-h-screen bg-black text-white">
      <AIVoice
        text={lastAIResponse}
        trigger={voiceTrigger}
        enabled={voiceEnabled}
      />

      {/* =========================
          MOBILE BACKDROP
      ========================= */}

      {sidebarOpen && (
        <div
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* =========================
          LEFT SIDEBAR
      ========================= */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-black transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 md:flex ${sidebarOpen
          ? "translate-x-0"
          : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h1 className="text-xl font-semibold">
              VERA AI
            </h1>

            <p className="mt-1 text-xs text-white/40">
              Your personal AI
              assistant
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-4">
          <button
            type="button"
            onClick={newChat}
            className="w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm transition hover:bg-white/10"
          >
            ＋ New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-white/30">
            Chat History
          </p>

          {loadingChats && (
            <p className="px-2 text-sm text-white/30">
              Loading chats...
            </p>
          )}

          {!loadingChats &&
            chats.length === 0 && (
              <p className="px-2 text-sm text-white/30">
                No conversations yet.
              </p>
            )}

          <div className="space-y-1">
            {chats.map((chat) => {
              const isDeleting =
                deletingChatId ===
                chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-lg transition ${chatId === chat.id
                    ? "bg-white/5"
                    : "hover:bg-white/5"
                    }`}
                >
                  {/* Chat */}
                  <button
                    type="button"
                    disabled={
                      isDeleting
                    }
                    onClick={() =>
                      openChat(
                        chat.id
                      )
                    }
                    className={`min-w-0 flex-1 rounded-lg px-3 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${chatId ===
                      chat.id
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white"
                      }`}
                  >
                    <p className="truncate">
                      {chat.title}
                    </p>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    disabled={
                      isDeleting ||
                      !!deletingChatId
                    }
                    onClick={(event) => {
                      event.stopPropagation();

                      handleDeleteChat(
                        chat.id
                      );
                    }}
                    className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      isDeleting
                        ? "Deleting..."
                        : "Delete chat"
                    }
                    aria-label={`Delete ${chat.title}`}
                  >
                    {isDeleting ? (
                      <span className="text-sm animate-pulse">
                        ...
                      </span>
                    ) : (
                      <Trash2
                        size={17}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          {userEmail ? (
            <>
              <p className="truncate text-sm text-white/70">
                👤 {userEmail}
              </p>

              <p className="mt-1 text-xs text-white/30">
                Logged in
              </p>

              <button
                type="button"
                onClick={logout}
                className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/login"
                )
              }
              className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10"
            >
              Login
            </button>
          )}
        </div>
      </aside>

      {/* =========================
          MAIN AREA
      ========================= */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="border-b border-white/10 px-4 py-5 md:px-6">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu */}
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/10 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <div>
                <h2 className="text-lg font-semibold">
                  {chatId
                    ? "Conversation"
                    : "New Chat"}
                </h2>

                <p className="text-xs text-white/40">
                  {userEmail
                    ? userEmail
                    : "Not logged in"}
                </p>
              </div>
            </div>

            {/* Mobile Login / Logout */}
            <div className="md:hidden">
              {userEmail ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/login"
                    )
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* =========================
            CHAT SECTION
        ========================= */}

        <section className="mx-auto flex min-h-[calc(100vh-85px)] w-full max-w-4xl flex-col px-4 py-10 md:px-6">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="mb-10 mt-10 text-center">
              <h1 className="flex items-center justify-center gap-3 text-3xl font-semibold md:text-4xl">
                <Sparkles
                  size={28}
                  strokeWidth={2.5}
                />

                <span>
                  {userName},{" "}
                  <span className="font-normal">
                    returns!
                  </span>
                </span>
              </h1>

              <p className="mt-3 text-white/50">
                Your intelligent
                personal assistant.
              </p>

              {userEmail && (
                <p className="mt-4 text-white/60">
                  Welcome back,{" "}
                  {userEmail}
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div
            ref={
              messagesContainerRef
            }
            onScroll={(event) => {
  const container = event.currentTarget;

  const distanceFromBottom =
    container.scrollHeight -
    container.scrollTop -
    container.clientHeight;

  const isNearBottom =
    distanceFromBottom < 80;

  shouldAutoScrollRef.current =
    isNearBottom;

  setShowJumpToLatest(
    !isNearBottom
  );
}}
            className="flex-1 space-y-5"
          >
            {messages.map(
              (msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[80%] md:px-5 md:py-4 ${msg.role === "user"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white"
                      }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mb-2 text-xs font-semibold text-white/50">
                        VERA
                      </div>
                    )}

                    <p className="whitespace-pre-wrap leading-7">
                      {msg.content ||
                        (isThinking && index === messages.length - 1
                          ? "VERA is thinking..."
                          : "")}
                    </p>
                  </div>
                </div>
              )
            )}

            {/*jump to latest button*/}

          {showJumpToLatest && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={jumpToLatest}
                className="rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white/80 shadow-lg transition hover:bg-white/10 hover:text-white"
              >
                ↓ Jump to latest
              </button>
            </div>
          )}


            {/* STOP BUTTON */}
            {loading && (
              <div className="sticky bottom-4 z-10 mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleStop}
                  className="rounded-xl bg-red-500 px-5 py-2 font-medium text-white transition hover:bg-red-600 active:scale-95"
                >
                  ⏹ Stop
                </button>
              </div>
            )}
          </div>

          {/* CHAT INPUT */}
          <ChatInput
            message={message}
            setMessage={setMessage}
            askVera={askVera}
            loading={loading}
            isListening={isListening}
            startVoiceInput={
              startVoiceConversation
            }
            handleFileSelect={
              handleFileSelect
            }
            fileInputRef={
              fileInputRef
            }
            selectedFile={
              selectedFile
            }
            clearSelectedFile={
              clearSelectedFile
            }
            voiceEnabled={
              voiceEnabled
            }
            setVoiceEnabled={
              setVoiceEnabled
            }
          />

          {/* Suggestions */}
          <div className="mt-8">
            {messages.length === 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {[
                  "📚 Study",
                  "💻 Coding",
                  "📄 Notes",
                  "🧠 Quiz",
                ].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      setMessage(
                        item.split(
                          " "
                        )[1]
                      )
                    }
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-white/20">
              Vera may make
              mistakes. Check
              important information.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}