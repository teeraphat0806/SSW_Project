"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Upload, X, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg");
  });
}

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setMessage(null);
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      setMessage(null);

      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", croppedBlob, "profile.jpg");

      const response = await fetch("/api/user/upload-profile", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setMessage({ type: "success", text: "อัพโหลดรูปโปรไฟล์สำเร็จ!" });

      // Update session with new image and force reload
      await update();

      // Redirect back to profile after 1.5 seconds with full page reload
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัพโหลด",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const imageDataUrl = await readFile(file);
        setImageSrc(imageDataUrl);
        setMessage(null);
      }
    }
  };

  if (!session) {
    return null;
  }

  const currentImage = session.user?.image;
  const userName = session.user?.name || "User";
  const initials = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 pt-20 md:p-8 pt-0 md:pl-32 pt-0 lg:pl-32 pt-0 ">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/profile")}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">แก้ไขรูปโปรไฟล์</h1>
            <p className="text-muted-foreground mt-1">
              อัพโหลดและปรับแต่งรูปภาพของคุณ
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Current Profile Image */}
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-lg">รูปโปรไฟล์ปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-64 h-64 rounded-full border-4 border-primary/20 shadow-2xl overflow-hidden bg-muted">
                  {currentImage ? (
                    <img
                      key={imageKey}
                      src={`${currentImage}?t=${imageKey}`}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-8xl font-bold text-primary/30">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {currentImage
                    ? "นี่คือรูปโปรไฟล์ปัจจุบันของคุณ"
                    : "คุณยังไม่มีรูปโปรไฟล์"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upload New Image */}
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-lg">
                {imageSrc ? "ปรับแต่งรูปภาพ" : "อัพโหลดรูปภาพใหม่"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* File Input - Drag and Drop Area */}
              {!imageSrc && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-105"
                      : "border-border hover:border-primary hover:bg-accent/50"
                  }`}
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-base font-medium mb-2 text-center">
                    {isDragging ? "วางไฟล์ที่นี่" : "ลากและวางรูปภาพที่นี่"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6 text-center">
                    หรือคลิกเพื่อเลือกไฟล์
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild size="lg" className="shadow-md">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      เลือกรูปภาพ
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    รองรับไฟล์: JPG, PNG, GIF (สูงสุด 10MB)
                  </p>
                </div>
              )}

              {/* Cropper */}
              {imageSrc && (
                <div className="space-y-4">
                  <div className="relative h-80 bg-muted rounded-xl overflow-hidden shadow-inner border-2 border-border">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="round"
                      showGrid={false}
                    />
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>ปรับซูม</span>
                      <span className="text-xs text-muted-foreground">
                        {zoom.toFixed(1)}x
                      </span>
                    </label>
                    <Slider
                      value={[zoom]}
                      min={1}
                      max={3}
                      step={0.1}
                      onValueChange={(value) => setZoom(value[0])}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1 h-11 shadow-md"
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          กำลังอัพโหลด...
                        </>
                      ) : (
                        <>
                          <Check className="h-5 w-5 mr-2" />
                          บันทึก
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={uploading}
                      className="flex-1 h-11"
                      size="lg"
                    >
                      <X className="h-5 w-5 mr-2" />
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg border-2 font-medium ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                      : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
