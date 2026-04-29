"use client";
import React, { useEffect, useRef, useState } from "react";
import { TextArea } from "@radix-ui/themes";
import {
  Loader2,
  ArrowBigRight,
  Lightbulb,
  BotMessageSquare,
  FileText,
} from "lucide-react";
import { ModeDropdown, type Mode } from "@/components/DropdownMenu";
import { exampleQueries } from "@/data/example-query/selectData";
import { exampleQueriesCreate } from "@/data/example-query/createData";
import { exampleQueriesEdit } from "@/data/example-query/editData";

type ChatMessage = {
  text?: string;
  isUser: boolean;
  type?: "text" | "pdf";
  fileUrl?: string;
  fileName?: string;
};

function MessageBox({
  message,
  isUser,
  type = "text",
  fileUrl,
  fileName,
}: {
  message?: string;
  isUser: boolean;
  type?: "text" | "pdf";
  fileUrl?: string;
  fileName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  // ถ้าเป็น PDF message (จาก AI)
  if (!isUser && type === "pdf" && fileUrl) {
    return (
      <div className="flex w-full mt-2 justify-start">
        <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
          <div className="w-full rounded-xl border bg-neutral-50  p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">
                ไฟล์ PDF จากระบบ
              </span>
            </div>

            {/* Preview PDF ในหน้าเลย */}
            <div className="w-full h-80 sm:h-96 rounded-lg border overflow-hidden bg-neutral-100 ">
              <iframe
                src={fileUrl}
                className="w-full h-full"
                title={fileName || "PDF file"}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={fileUrl}
                download={fileName || "document.pdf"}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm hover:bg-blue-700 transition"
              >
                ดาวน์โหลดไฟล์
              </a>
              <button
                type="button"
                onClick={() => window.open(fileUrl, "_blank")}
                className="px-3 py-1.5 rounded-lg border text-xs sm:text-sm hover:bg-neutral-100 transition"
              >
                เปิดในแท็บใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ปกติ: ข้อความธรรมดา
  return (
    <div
      className={`flex w-full mt-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
        <div
          className={`w-fit h-auto px-4 py-2 rounded-xl break-words ${
            isUser
              ? "bg-blue-600 text-white self-end"
              : "bg-neutral-200 text-neutral-900 self-start "
          }`}
        >
          <p className="text-sm sm:text-base whitespace-pre-wrap">
            {message ?? ""}
          </p>
        </div>
        {!isUser && message && (
          <div className="flex gap-2 mt-1 self-start">
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-xs sm:text-sm rounded-lg border hover:text-gray-600 hover:cursor-pointer active:scale-95 transition bg-background "
            >
              {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
            </button>
          </div>
        )}
        {isUser && message && (
          <div className="flex gap-2 mt-1 self-end">
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-xs sm:text-sm rounded-lg border hover:text-gray-600 hover:cursor-pointer active:scale-95 transition bg-background "
            >
              {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userText, setUserText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = React.useState<Mode>("view");
  const [hint, setHint] = useState("");

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

  const handleHint = () => {
    let newHint = "";
    console.log("hint", hint);
    if (mode === "view") {
      newHint =
        "💡แนะนำ: สามารถถามข้อมูลลูกค้า ข้อมูลการสั่งซื้อ ข้อมูลสต็อคสินค้าได้เลย";
    } else if (mode === "createData") {
      newHint = "💡แนะนำ: เพิ่มข้อมูลลูกค้าใหม่ ออเดอร์ได้เลย ";
    } else if (mode === "editData") {
      newHint = "💡แนะนำ: แก้ไขข้อมูลลูกค้าใหม่ ออเดอร์ได้เลย";
    }
    setHint(newHint);
    setMessages((prev) => [
      ...prev,
      {
        text: newHint,
        isUser: false,
        type: "text",
      },
    ]);
  };

  // helper: ดึงชื่อไฟล์จาก header ถ้ามี
  const extractFileNameFromContentDisposition = (cd: string | null) => {
    if (!cd) return undefined;
    const match = /filename\*?=(?:UTF-8''|")?([^;\n"]+)/i.exec(cd);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1].replace(/"/g, "").trim());
      } catch {
        return match[1].replace(/"/g, "").trim();
      }
    }
    return undefined;
  };

  const handleSend = async () => {
    if (!userText.trim()) return;

    const currentText = userText;
    setUserText("");
    setIsLoading(true);

    // ดันข้อความ user ก่อน
    setMessages((prev) => [
      ...prev,
      { text: currentText, isUser: true, type: "text" },
    ]);

    if (mode === "view") {
      try {
        const response = await fetch("/api/chatbot/chatdeepseek", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: currentText }),
        });

        const contentType = response.headers.get("content-type") || "";

        // ถ้าเป็น PDF
        if (contentType.includes("application/pdf")) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const fileName = extractFileNameFromContentDisposition(
            response.headers.get("content-disposition"),
          );

          setMessages((prev) => [
            ...prev,
            {
              isUser: false,
              type: "pdf",
              fileUrl: url,
              fileName: fileName || "document.pdf",
            },
          ]);
        } else {
          // ปกติ: json
          const data = await response.json();

          setMessages((prev) => [
            ...prev,
            {
              text: data.result ?? "ไม่พบข้อมูลจาก API",
              isUser: false,
              type: "text",
            },
          ]);
        }
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            text: "เกิดข้อผิดพลาดในการเชื่อมต่อ API",
            isUser: false,
            type: "text",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (mode === "createData") {
      await new Promise((r) => setTimeout(r, 1000));
      setMessages((prev) => [
        ...prev,
        {
          text: "AI reply (create): " + currentText,
          isUser: false,
          type: "text",
        },
      ]);
      setIsLoading(false);
    } else if (mode === "editData") {
      await new Promise((r) => setTimeout(r, 1000));
      setMessages((prev) => [
        ...prev,
        {
          text: "AI reply (edit): " + currentText,
          isUser: false,
          type: "text",
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen">
      {/* พื้นที่ข้อความ */}
      <div className="flex-1 overflow-y-auto">
        {messages.length ? (
          <div
            ref={listRef}
            className="h-full flex flex-col space-y-2 px-4 py-4 mx-auto w-full max-w-3xl"
          >
            {messages.map((msg, i) => (
              <MessageBox
                key={i}
                message={msg.text}
                isUser={msg.isUser}
                type={msg.type}
                fileUrl={msg.fileUrl}
                fileName={msg.fileName}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full px-4">
            <div className="flex items-center gap-4 ">
              <BotMessageSquare className="w-10 h-10 sm:w-16 sm:h-16" />
              <h2 className="text-2xl font-semibold mb-4">
                สวัสดี! ยินดีต้อนรับสู่ AI
              </h2>
            </div>
            <p className="text-gray-600 mb-6 ">
              สามารถสอบถามข้อมูลต่างๆได้เลย เช่น ข้อมูลลูกค้า ข้อมูลการสั่งซื้อ
              หรือแม้แต่เพิ่มข้อมูลลูกค้าใหม่
            </p>
          </div>
        )}
      </div>

      {/* กล่องพิมพ์อยู่ล่างสุด */}
      <div className="px-4 pb-4">
        <div
          className="border-2 flex flex-col gap-2 rounded-3xl space-y-3 p-3 mx-auto w-full max-w-3xl
              shadow-[0_4px_15px_rgba(0,0,0,0.05)]
              border-transparent 
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
            className="flex-1 border-0 focus:ring-0 px-3 py-2 text-sm sm:text-base rounded-lg"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <ModeDropdown value={mode} onChange={setMode} />
              <button
                disabled={isLoading}
                className="px-3 sm:px-5 rounded-xl sm:rounded-full flex items-center justify-center transition bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer text-sm sm:text-base disabled:opacity-60"
                onClick={handleRandom}
              >
                🎲 สุ่ม
              </button>
              <button onClick={handleHint} type="button">
                <Lightbulb className="opacity-70 hover:cursor-pointer hover:opacity-100 hover:scale-110 transition-all" />
              </button>
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              {/* <p className="font-medium text-sm sm:text-base">DeepSeek V3</p> */}
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
