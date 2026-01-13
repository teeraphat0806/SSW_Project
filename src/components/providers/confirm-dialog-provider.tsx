"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog" // ตรวจสอบ path ของคุณให้ถูกต้อง

// กำหนด Type ของ Option ที่จะรับเข้ามา
type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" // เผื่ออยากได้ปุ่มแดง
}

// สร้าง Context
const ConfirmDialogContext = React.createContext<
  (options: ConfirmOptions) => Promise<boolean>
>(async () => false)

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ConfirmOptions>({})
  const [resolver, setResolver] = React.useState<((value: boolean) => void) | null>(null)

  // ฟังก์ชันหลักที่ Component อื่นจะเรียกใช้
  const confirm = React.useCallback(
    (options: ConfirmOptions) => {
      setOptions({
        title: options.title || "ยืนยันการทำรายการ",
        description: options.description || "คุณต้องการดำเนินการต่อใช่หรือไม่?",
        confirmText: options.confirmText || "ยืนยัน",
        cancelText: options.cancelText || "ยกเลิก",
        variant: options.variant || "default",
      })
      setOpen(true)

      // สร้าง Promise เพื่อรอให้ผู้ใช้กดปุ่ม
      return new Promise<boolean>((resolve) => {
        setResolver(() => resolve)
      })
    },
    []
  )

  const handleConfirm = () => {
    if (resolver) resolver(true) // ส่งค่า true กลับไป
    setOpen(false)
  }

  const handleCancel = () => {
    if (resolver) resolver(false) // ส่งค่า false กลับไป
    setOpen(false)
  }

  // ปิด Dialog กรณี User กดปุ่ม Esc หรือคลิกพื้นหลัง (ถือเป็น Cancel)
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen && resolver) {
        resolver(false)
    }
  }

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      
      {/* ตัว Dialog กลางที่จะลอยขึ้นมา */}
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleConfirm}
                className={options.variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  )
}

// Hook สำหรับดึงไปใช้งาน
export const useConfirm = () => React.useContext(ConfirmDialogContext)