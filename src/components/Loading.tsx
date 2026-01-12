"use client";

import React from "react";

type LoadingScreenProps ={
    message?: string;
}

export function LoadingScreen({
    message = "กำลังโหลดข้อมูล...",
}: LoadingScreenProps) {
    return(
         <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
    );
}