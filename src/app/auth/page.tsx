"use client";
import React, { useMemo, useState } from "react";
import { useAuth } from "../../contexts/Authcontext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "../globals.css";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [tab, setTab] = useState("signin");
  const { user, signUp } = useAuth();
  const router = useRouter();

  // Staff data fields
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [taxId, setTaxId] = useState("");
  const [socialSecurity, setSocialSecurity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [salary, setSalary] = useState("");

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(120deg, rgba(7, 12, 21, 0.5), rgba(10, 16, 29, 0.35)), url('/steelcutbackground.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }),
    []
  );

  if (user) {
    router.replace("/profile");
    return;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        toast.error("wrong email or password", {
          position: "bottom-right",
        });
      } else {
        toast.success("Login successful!", {
          position: "bottom-right",
        });
        router.push("/profile");
      }
    } catch (error) {
      console.log("error", error);
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName, {
        bankName,
        bankAccount,
        taxid: taxId,
        startDate,
        social_security: socialSecurity,
        currentSalary: salary ? parseInt(salary) : undefined,
      });

      if (error) {
        toast.error(
          "Error: " +
            (typeof error === "string"
              ? error
              : error?.message || "Something went wrong, please try again"),
          {
            position: "bottom-right",
          }
        );
      } else {
        toast.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ.", {
          position: "bottom-right",
        });
        // Reset form
        setEmail("");
        setPassword("");
        setFullName("");
        setBankName("");
        setBankAccount("");
        setTaxId("");
        setSocialSecurity("");
        setStartDate("");
        setSalary("");
        setTab("signin");
      }
    } catch (error) {
      toast.error("An unexpected error occurred", {
        position: "bottom-right",
      });
    }

    setIsLoading(false);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={backgroundStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/55 via-slate-900/35 to-slate-950/55" />
      <div
        className="absolute inset-0 mix-blend-screen opacity-25"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-white/15 bg-slate-950/85 text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center shadow-lg shadow-blue-900/40">
              <div className="flex items-center justify-center text-white">
                <svg
                  viewBox="0 0 100 100"
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Triangle */}
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />

                  {/* S (top text) */}
                  <text
                    x="50"
                    y="40"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill="currentColor"
                  >
                    S
                  </text>

                  {/* S W (bottom text) */}
                  <text
                    x="50"
                    y="60"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill="currentColor"
                  >
                    S W
                  </text>
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.22em] text-blue-100/90">
                s.s.w. steel center
              </p>
              <CardTitle className="text-3xl font-semibold text-white">
                {tab === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </CardTitle>
              <CardDescription className="text-slate-300">
                ระบบจัดการงานเหล็กครบวงจรสำหรับทีมของคุณ
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/5 p-1">
                <TabsTrigger
                  value="signin"
                  className="rounded-full data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  เข้าสู่ระบบ
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-full data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  สมัครสมาชิก
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ชื่ออีเมลบริษัท"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-200">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="รหัสผ่าน"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 shadow-lg shadow-blue-900/40"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    เข้าสู่ระบบ
                  </Button>
                </form>
              </TabsContent>

              <TabsContent
                value="signup"
                className="mt-6 max-h-[65vh] overflow-y-auto"
              >
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Basic Information Section */}
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                      ข้อมูลพื้นฐาน
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-slate-200">
                          ชื่อ-นามสกุล
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="ชื่อ-นามสกุล"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-email"
                          className="text-slate-200"
                        >
                          Email
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="อีเมลบริษัท"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-password"
                          className="text-slate-200"
                        >
                          รหัสผ่าน
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="ตั้งรหัสผ่าน"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Staff Information Section */}
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                      ข้อมูลพนักงาน
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-slate-200">
                          วันที่เริ่มงาน
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary" className="text-slate-200">
                          เงินเดือน (บาท)
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          placeholder="เงินเดือน"
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax-id" className="text-slate-200">
                          เลขประจำตัวผู้เสียภาษี
                        </Label>
                        <Input
                          id="tax-id"
                          type="text"
                          placeholder="เลขประจำตัวผู้เสียภาษี"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="social-security"
                          className="text-slate-200"
                        >
                          เลขประกันสังคม
                        </Label>
                        <Input
                          id="social-security"
                          type="text"
                          placeholder="เลขประกันสังคม"
                          value={socialSecurity}
                          onChange={(e) => setSocialSecurity(e.target.value)}
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Information Section */}
                  <div className="pb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                      ข้อมูลบัญชีธนาคาร
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bank-name" className="text-slate-200">
                          ชื่อธนาคาร
                        </Label>
                        <Input
                          id="bank-name"
                          type="text"
                          placeholder="ชื่อธนาคาร"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="bank-account"
                          className="text-slate-200"
                        >
                          เลขบัญชี
                        </Label>
                        <Input
                          id="bank-account"
                          type="text"
                          placeholder="เลขบัญชี"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 shadow-lg shadow-blue-900/40"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    สมัครสมาชิก
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <ToastContainer />
    </div>
  );
}
