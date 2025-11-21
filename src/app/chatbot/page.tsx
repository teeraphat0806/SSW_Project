"use client";
import React, { useEffect, useRef, useState } from "react";
import { TextArea } from "@radix-ui/themes";
import { Loader2, ArrowBigRight } from "lucide-react";
import { ModeDropdown, type Mode } from "@/components/DropdownMenu";
import { exampleQueries } from "@/data/example-query/selectData";
import { exampleQueriesCreate } from "@/data/example-query/createData";
import { exampleQueriesEdit } from "@/data/example-query/editData";

function MessageBox({
  message,
  isUser,
}: {
  message: string;
  isUser?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div
      className={`flex w-full mt-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
        <div
          className={`w-fit h-auto px-4 py-2 rounded-xl break-words ${
            isUser
              ? "bg-blue-600 text-white self-end"
              : "bg-neutral-200 text-neutral-900 self-start"
          }`}
        >
          <p className="text-sm sm:text-base">{message}</p>
        </div>
        <div
          className={`flex gap-2 mt-1 ${isUser ? "self-end" : "self-start"}`}
        >
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs sm:text-sm rounded-lg border hover:text-gray-600 hover:cursor-pointer active:scale-95 transition"
          >
            {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    [{ text: "Hello! 👋", isUser: false }]
  );
  const [userText, setUserText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = React.useState<Mode>("view");

  // auto scroll ไปล่างเมื่อมีข้อความใหม่
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleRandom = () => {
    if (mode === "view") {
      const rnd =
        exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
      setUserText(rnd);
    } else if (mode === "createData") {
      const rnd =
        exampleQueriesCreate[
          Math.floor(Math.random() * exampleQueriesCreate.length)
        ];
      setUserText(rnd);
    } else if (mode === "editData") {
      const rnd =
        exampleQueriesEdit[
          Math.floor(Math.random() * exampleQueriesEdit.length)
        ];
      setUserText(rnd);
    }
  };

  const handleSend = async () => {
    if (!userText.trim()) return;

    const currentText = userText;
    setUserText("");
    setIsLoading(true);

    // ดันข้อความ user ก่อน
    setMessages((prev) => [...prev, { text: currentText, isUser: true }]);

    if (mode === "view") {
      try {
        const response = await fetch("/api/chatbot/chatdeepseek", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: currentText }),
        });

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            text: data.result ?? "ไม่พบข้อมูลจาก API",
            isUser: false,
          },
        ]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            text: "เกิดข้อผิดพลาดในการเชื่อมต่อ API",
            isUser: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (mode === "createData") {
      await new Promise((r) => setTimeout(r, 1000));
      setMessages((prev) => [
        ...prev,
        { text: "AI reply (create): " + currentText, isUser: false },
      ]);
      setIsLoading(false);
    } else if (mode === "editData") {
      await new Promise((r) => setTimeout(r, 1000));
      setMessages((prev) => [
        ...prev,
        { text: "AI reply (edit): " + currentText, isUser: false },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen">
      {/* พื้นที่ข้อความ */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={listRef}
          className="h-full flex flex-col space-y-2 px-4 py-4 mx-auto w-full max-w-3xl"
        >
          {messages.map((msg, i) => (
            <MessageBox key={i} message={msg.text} isUser={msg.isUser} />
          ))}
        </div>
      </div>

      {/* กล่องพิมพ์อยู่ล่างสุด */}
      <div className="px-4 pb-4">
        <div
          className="border-2 flex flex-col gap-2 rounded-3xl space-y-3 p-3 mx-auto w-full max-w-3xl
              shadow-[0_4px_15px_rgba(0,0,0,0.05)]
              dark:shadow-[0_0_25px_2px_rgba(59,130,246,0.25)]
              border-transparent dark:border-gray-800
              
              transition-all duration-300"
        >
          <TextArea
            resize="none"
            placeholder={isLoading ? "Waiting for AI…" : "Type a message…"}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 border-0 focus:ring-0 px-3 py-2 text-sm sm:text-base  rounded-lg"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <ModeDropdown value={mode} onChange={setMode} />
              <button
                disabled={isLoading}
                className="px-3 sm:px-5 rounded-xl sm:rounded-full flex items-center justify-center transition bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer text-sm sm:text-base"
                onClick={handleRandom}
              >
                🎲 สุ่ม
              </button>
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <p className="font-medium text-sm sm:text-base">DeepSeek V3</p>
              <button
                onClick={handleSend}
                disabled={isLoading || !userText.trim()}
                className={`p-2 rounded-full flex items-center justify-center transition
                      ${
                        isLoading || !userText.trim()
                          ? "bg-blue-400 cursor-not-allowed opacity-70"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <ArrowBigRight className="w-7 h-7 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
