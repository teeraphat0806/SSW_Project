import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileHeaderProps {
  userName: string;
  userEmail: string;
  userImage?: string | null;
  initials: string;
}

export default function ProfileHeader({
  userName,
  userEmail,
  userImage,
  initials,
}: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <div className="p-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-white/70 dark:border-white/25 shadow-lg bg-black/10 dark:bg-white/10 flex items-center justify-center overflow-hidden">
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold">{initials}</span>
            )}
          </div>
          <button
            onClick={() => router.push("/profile/edit")}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center border-2 border-[hsl(var(--primary))] hover:cursor-pointer"
            aria-label="เปลี่ยนรูปโปรไฟล์"
          >
            <Camera className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        <h1 className="text-3xl font-bold">{userName}</h1>

        <p className="opacity-90">{userEmail}</p>
      </div>
    </div>
  );
}
