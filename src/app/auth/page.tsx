"use client";
import React, { useMemo, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "../globals.css";

// Thai banks list
const THAI_BANKS = [
  { code: "BBL", name: "ธนาคารกรุงเทพ" },
  { code: "KBANK", name: "ธนาคารกสิกรไทย" },
  { code: "KTB", name: "ธนาคารกรุงไทย" },
  { code: "BAY", name: "ธนาคารกรุงเทพ (ยูฟ่า)" },
  { code: "BEC", name: "ธนาคารเบสิค" },
  { code: "CIMB", name: "ธนาคารซีไอเอ็มบี ไทย" },
  { code: "TMRW", name: "ธนาคาร TMRW" },
  { code: "UOB", name: "ธนาคารยูโอบี" },
  { code: "SCB", name: "ธนาคารไทยพาณิชย์" },
  { code: "TTB", name: "ธนาคารทหารไทย" },
  { code: "GSB", name: "ธนาคารออมสิน" },
  { code: "ISBT", name: "ธนาคารอิสลามแห่งประเทศไทย" },
  { code: "LHBANK", name: "ธนาคารลาดหญ้า" },
  { code: "AYUDHYA", name: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อม" },
  { code: "TBANK", name: "ธนาคารไทยร่วมทุน" },
  { code: "ICBC", name: "ธนาคารอิศบร" },
  { code: "BCHT", name: "ธนาคารจีนแรนดส์" },
  { code: "JPYUAB", name: "ธนาคารยูเอเอ็บ" },
  { code: "RBS", name: "ธนาคารรอยัล แบงก์ ออฟ สกอตแลนด์" },
  { code: "AKBANK", name: "ธนาคารหาจัก" },
  { code: "MIZUHO", name: "ธนาคารมิซูโฮ" },
  { code: "MUFG", name: "ธนาคารมูฟจิ" },
  { code: "SUMITOMO", name: "ธนาคารซูมิโตโม มิตซูย ทรัสต์" },
  { code: "DBS", name: "ธนาคารดีบีเอส" },
  { code: "BOA", name: "ธนาคารบางกรรมการของอเมริกา" },
  { code: "ANZ", name: "ธนาคารเอเอ็นแซด" },
  { code: "CITI", name: "ธนาคารซิตี้แบงก์" },
  { code: "HSBC", name: "ธนาคารเอชเอสบีซี" },
  { code: "KDB", name: "ธนาคารเคดีบี" },
] as const;

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

const isPasswordStrong = (password: string): boolean => {
  const validation = validatePassword(password);
  return (
    validation.length &&
    validation.uppercase &&
    validation.lowercase &&
    validation.number &&
    validation.special
  );
};

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

  // Validation state
  const [showPasswordFeedback, setShowPasswordFeedback] = useState(false);

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

  // Validation checks
  const emailValid = !email || validateEmail(email);
  const passwordValid = !password || isPasswordStrong(password);
  const nameValid = fullName.trim().length > 0;
  const taxIdValid = !taxId || (taxId.length === 13 && /^\d+$/.test(taxId));
  const socialSecurityValid =
    !socialSecurity ||
    (socialSecurity.length === 13 && /^\d+$/.test(socialSecurity));
  const startDateValid = !startDate || new Date(startDate) <= new Date();
  const salaryValid =
    !salary || (parseInt(salary) >= 0 && /^\d+$/.test(salary));
  const bankNameValid = bankName.trim().length > 0;
  const bankAccountValid =
    !bankAccount ||
    (bankAccount.length >= 10 &&
      bankAccount.length <= 15 &&
      /^\d+$/.test(bankAccount));

  // All required fields are valid
  const isFormValid =
    nameValid &&
    emailValid &&
    email.trim().length > 0 &&
    passwordValid &&
    password.length > 0 &&
    bankNameValid &&
    taxIdValid &&
    socialSecurityValid &&
    startDateValid &&
    salaryValid &&
    bankAccountValid;

  const passwordValidation = validatePassword(password);
  const passwordStrength =
    Object.values(passwordValidation).filter(Boolean).length;

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

    // Validate before submission
    if (!isFormValid) {
      toast.error("กรุณากรอกข้อมูลให้ถูกต้องทั้งหมด", {
        position: "bottom-right",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName, {
        bankName,
        bankAccount: bankAccount || undefined,
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
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                        email && !emailValid ? "border-red-500 border" : ""
                      }`}
                    />
                    {!email && (
                      <p className="text-xs text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        กรุณากรอก Email
                      </p>
                    )}
                    {email && !emailValid && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        กรุณากรอก Email ที่ถูกต้อง
                      </p>
                    )}
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
                    {!password && (
                      <p className="text-xs text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        กรุณากรอก Password
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      isLoading ||
                      (email.length > 0 && !emailValid) ||
                      email.length === 0 ||
                      password.length === 0
                    }
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
                          ชื่อ-นามสกุล <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="ชื่อ-นามสกุล"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            fullName && !nameValid
                              ? "border-red-500 border"
                              : ""
                          }`}
                        />
                        {fullName && !nameValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            กรุณากรอกชื่อ-นามสกุล
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-email"
                          className="text-slate-200"
                        >
                          Email <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="example@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            email && !emailValid ? "border-red-500 border" : ""
                          }`}
                        />
                        {email && !emailValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            กรุณากรอก Email ที่ถูกต้อง
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-password"
                          className="text-slate-200"
                        >
                          รหัสผ่าน <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="ตั้งรหัสผ่านที่มีความปลอดภัย"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setShowPasswordFeedback(true);
                          }}
                          onBlur={() => setShowPasswordFeedback(false)}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            password && !passwordValid
                              ? "border-red-500 border"
                              : ""
                          }`}
                        />

                        {showPasswordFeedback && password && (
                          <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              {passwordValidation.length ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span
                                className={
                                  passwordValidation.length
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                อย่างน้อย 8 ตัวอักษร
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.uppercase ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span
                                className={
                                  passwordValidation.uppercase
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                มีอักษรพิมพ์ใหญ่ (A-Z)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.lowercase ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span
                                className={
                                  passwordValidation.lowercase
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                มีอักษรพิมพ์เล็ก (a-z)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.number ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span
                                className={
                                  passwordValidation.number
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                มีตัวเลข (0-9)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordValidation.special ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span
                                className={
                                  passwordValidation.special
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                มีอักษรพิเศษ (!@#$%^&* เป็นต้น)
                              </span>
                            </div>
                            <div className="mt-2 flex h-1 gap-1 bg-slate-700 rounded-full overflow-hidden">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 ${
                                    i < passwordStrength
                                      ? passwordStrength <= 2
                                        ? "bg-red-500"
                                        : passwordStrength <= 3
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                      : "bg-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
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
                          วันที่เริ่มงาน <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            startDate && !startDateValid
                              ? "border-red-500 border"
                              : ""
                          }`}
                        />
                        {startDate && !startDateValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            เลือกวันในอดีต หรือ วันนี้เท่านั้น
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary" className="text-slate-200">
                          เงินเดือน (บาท){" "}
                          <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          placeholder="เงินเดือน"
                          value={salary}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d+$/.test(value)) {
                              setSalary(value);
                            }
                          }}
                          min="0"
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            salary && !salaryValid
                              ? "border-red-500 border"
                              : ""
                          }`}
                        />
                        {salary && !salaryValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            กรุณากรอกตัวเลขที่ไม่เป็นลบ
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax-id" className="text-slate-200">
                          เลขประจำตัวผู้เสียภาษี{" "}
                          <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="tax-id"
                          type="text"
                          placeholder="กรุณาป้อน 13 หลัก"
                          value={taxId}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 13);
                            setTaxId(value);
                          }}
                          maxLength={13}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            taxId && !taxIdValid ? "border-red-500 border" : ""
                          }`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {taxId ? `${taxId.length}/13` : "ต้องเป็น 13 หลัก"}
                        </p>
                        {taxId && !taxIdValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            ต้องเป็นตัวเลข 13 หลักเท่านั้น
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="social-security"
                          className="text-slate-200"
                        >
                          เลขประกันสังคม <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="social-security"
                          type="text"
                          placeholder="กรุณาป้อน 13 หลัก"
                          value={socialSecurity}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 13);
                            setSocialSecurity(value);
                          }}
                          maxLength={13}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            socialSecurity && !socialSecurityValid
                              ? "border-red-500 border"
                              : ""
                          }`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {socialSecurity
                            ? `${socialSecurity.length}/13`
                            : "ต้องเป็น 13 หลัก"}
                        </p>
                        {socialSecurity && !socialSecurityValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            ต้องเป็นตัวเลข 13 หลักเท่านั้น
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bank Information Section */}
                  <div className="pb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                      ข้อมูลบัญชีธนาคาร
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="bank-name" className="text-slate-200">
                          ชื่อธนาคาร <span className="text-red-400">*</span>
                        </Label>
                        <Select
                          value={bankName}
                          onValueChange={(value) => setBankName(value)}
                        >
                          <SelectTrigger
                            className={`bg-slate-900/60 border-white/10 text-white ${
                              bankName === "" && isFormValid
                                ? "border-red-500"
                                : ""
                            }`}
                          >
                            <SelectValue placeholder="เลือกธนาคาร" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10">
                            {THAI_BANKS.map((bank) => (
                              <SelectItem
                                key={bank.code}
                                value={bank.name}
                                className="text-white hover:bg-slate-800"
                              >
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!bankNameValid && bankName === "" && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            กรุณาเลือกธนาคาร
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label
                          htmlFor="bank-account"
                          className="text-slate-200"
                        >
                          เลขบัญชี (ไม่บังคับ)
                        </Label>
                        <Input
                          id="bank-account"
                          type="text"
                          placeholder="กรุณาป้อน 10-15 หลัก หรือ ปล่อยว่างได้"
                          value={bankAccount}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 15);
                            setBankAccount(value);
                          }}
                          maxLength={15}
                          className={`bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 ${
                            bankAccount && !bankAccountValid
                              ? "border-red-500 border"
                              : ""
                          }`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {bankAccount
                            ? `${bankAccount.length}/15 (ต้องมี 10-15 หลัก)`
                            : "ไม่บังคับ (10-15 หลัก)"}
                        </p>
                        {bankAccount && !bankAccountValid && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            เลขบัญชีต้องเป็นตัวเลข 10-15 หลัก
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !isFormValid}
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
