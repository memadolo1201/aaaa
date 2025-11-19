import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});

const signupSchema = z.object({
  fullName: z.string().min(3, { message: "الاسم يجب أن يكون 3 أحرف على الأقل" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate
      loginSchema.parse({ email: loginEmail, password: loginPassword });
      
      setIsSubmitting(true);
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else if (error.code === "auth/invalid-credential") {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (error.code === "auth/user-not-found") {
        toast.error("المستخدم غير موجود");
      } else if (error.code === "auth/wrong-password") {
        toast.error("كلمة المرور غير صحيحة");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("محاولات كثيرة جداً، يرجى المحاولة لاحقاً");
      } else {
        toast.error("فشل تسجيل الدخول");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate
      signupSchema.parse({
        fullName: signupFullName,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });
      
      setIsSubmitting(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupEmail,
        signupPassword
      );
      
      // Update profile with full name
      await updateProfile(userCredential.user, {
        displayName: signupFullName,
      });
      
      toast.success("تم إنشاء الحساب بنجاح");
      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error);
      
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else if (error.code === "auth/email-already-in-use") {
        toast.error("البريد الإلكتروني مستخدم بالفعل");
      } else if (error.code === "auth/weak-password") {
        toast.error("كلمة المرور ضعيفة جداً");
      } else if (error.code === "auth/invalid-email") {
        toast.error("البريد الإلكتروني غير صحيح");
      } else {
        toast.error("فشل إنشاء الحساب");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent via-accent-light to-accent-dark flex items-center justify-center shadow-[0_8px_32px_-8px_hsl(var(--accent)/0.6)] mb-4">
            <Scale className="w-10 h-10 text-primary-dark" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">المحاماة الفاخرة</h1>
          <p className="text-muted-foreground">نظام الإدارة القانونية المتكامل</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">مرحباً بك</CardTitle>
            <CardDescription className="text-center">
              سجل الدخول أو أنشئ حساباً جديداً للبدء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  حساب جديد
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      كلمة المرور
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent to-accent-dark hover:opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      الاسم الكامل
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="أحمد محمد"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="example@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      كلمة المرور
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      تأكيد كلمة المرور
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent to-accent-dark hover:opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
