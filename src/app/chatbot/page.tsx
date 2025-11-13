"use client";
import React from "react";
import { useEffect, useRef, useState } from "react";
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
  return (
    <div
      className={`w-fit max-w-[80%] h-auto px-4 py-2 rounded-xl mt-2 break-words ${
        isUser
          ? "bg-blue-600 text-white self-end"
          : "bg-neutral-200 text-neutral-900 self-start"
      }`}
    >
      <p>{message}</p>
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

    const currentText = userText; // กันไว้เผื่อเราเคลียร์ state ทีหลัง
    setUserText(""); // เคลียร์ช่องพิมพ์เลย รู้สึกฟีลแชตมากกว่า
    setIsLoading(true);

    if (mode === "view") {
      // ดันข้อความ user ก่อน
      setMessages((prev) => [...prev, { text: currentText, isUser: true }]);

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
      setMessages((prev) => [...prev, { text: currentText, isUser: true }]);

      await new Promise((r) => setTimeout(r, 1000));
      setMessages((prev) => [
        ...prev,
        { text: "AI reply (create): " + currentText, isUser: false },
      ]);
      setIsLoading(false);
    } else if (mode === "editData") {
      setMessages((prev) => [...prev, { text: currentText, isUser: true }]);

      await new Promise((r) => setTimeout(r, 1000));
      setMessages((prev) => [
        ...prev,
        { text: "AI reply (edit): " + currentText, isUser: false },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen  ">
      {/* พื้นที่ข้อความ (scroll ได้) */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2 mx-[450px]"
      >
        {messages.map((msg, i) => (
          <MessageBox key={i} message={msg.text} isUser={msg.isUser} />
        ))}
      </div>

      {/* กล่องพิมพ์อยู่ล่างสุด */}
      <div
        className=" border-2  flex-col items-center gap-2 mx-[450px] rounded-3xl space-y-3 mb-5 p-3 
              shadow-[0_4px_15px_rgba(0,0,0,0.1)] 
              dark:shadow-[0_0_25px_2px_rgba(59,130,246,0.3)] 
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
          className="flex-1 border-0 focus:ring-0 px-3 py-2 text-sm bg-gray-100 rounded-lg"
          rows={1}
          disabled={isLoading}
        />
        <div className="flex justify-between">
          <div className="flex gap-2">
            <ModeDropdown value={mode} onChange={setMode} />
            <button
              disabled={isLoading}
              className="px-5 rounded-full flex items-center justify-center transition bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
              onClick={handleRandom}
            >
              🎲 สุ่ม
            </button>
          </div>
          <div className="flex gap-4 ">
            <p className="font-medium mt-3">DeepSeek V3</p>
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
    </main>
  );
}
