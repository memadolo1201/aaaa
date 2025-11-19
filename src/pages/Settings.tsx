import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, User, Building2, Bell, Lock, Mail, Phone, Globe, Shield, Key, Clock, FileText, Save, Volume2, Upload, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const Settings = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationDays, setNotificationDays] = useState("1");
  
  // Office info states
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");
  const [officeWebsite, setOfficeWebsite] = useState("");
  const [officeLogo, setOfficeLogo] = useState("");

  useEffect(() => {
    // Load settings from localStorage
    const savedSoundEnabled = localStorage.getItem('notificationSoundEnabled');
    const savedNotificationDays = localStorage.getItem('notificationDaysBefore');
    const savedLanguage = localStorage.getItem('appLanguage');
    const savedOfficeName = localStorage.getItem('officeName');
    const savedOfficeAddress = localStorage.getItem('officeAddress');
    const savedOfficePhone = localStorage.getItem('officePhone');
    const savedOfficeEmail = localStorage.getItem('officeEmail');
    const savedOfficeWebsite = localStorage.getItem('officeWebsite');
    const savedOfficeLogo = localStorage.getItem('officeLogo');
    
    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true');
    }
    if (savedNotificationDays !== null) {
      setNotificationDays(savedNotificationDays);
    }
    if (savedOfficeName) setOfficeName(savedOfficeName);
    if (savedOfficeAddress) setOfficeAddress(savedOfficeAddress);
    if (savedOfficePhone) setOfficePhone(savedOfficePhone);
    if (savedOfficeEmail) setOfficeEmail(savedOfficeEmail);
    if (savedOfficeWebsite) setOfficeWebsite(savedOfficeWebsite);
    if (savedOfficeLogo) setOfficeLogo(savedOfficeLogo);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOfficeLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Save notification settings
    localStorage.setItem('notificationSoundEnabled', soundEnabled.toString());
    localStorage.setItem('notificationDaysBefore', notificationDays);
    
    // Save office info
    localStorage.setItem('officeName', officeName);
    localStorage.setItem('officeAddress', officeAddress);
    localStorage.setItem('officePhone', officePhone);
    localStorage.setItem('officeEmail', officeEmail);
    localStorage.setItem('officeWebsite', officeWebsite);
    localStorage.setItem('officeLogo', officeLogo);
    
    toast({
      title: t('save'),
      description: "تم حفظ التغييرات بنجاح",
    });
  };


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-3 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-accent-light to-accent-dark flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-9 h-9 text-primary-dark" />
            </div>
            الإعدادات
          </h1>
          <p className="text-muted-foreground text-lg mr-20">إدارة وتخصيص النظام بشكل كامل</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-primary-dark font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Save className="w-5 h-5 ml-2" />
          حفظ جميع التغييرات
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-5 gap-2 bg-card/50 backdrop-blur-sm p-2 rounded-2xl shadow-lg h-auto">
          <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-accent data-[state=active]:to-accent-dark data-[state=active]:text-primary-dark data-[state=active]:shadow-lg rounded-xl py-3 font-bold text-base transition-all duration-300">
            <User className="w-5 h-5 ml-2" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="office" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-accent data-[state=active]:to-accent-dark data-[state=active]:text-primary-dark data-[state=active]:shadow-lg rounded-xl py-3 font-bold text-base transition-all duration-300">
            <Building2 className="w-5 h-5 ml-2" />
            المكتب
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-accent data-[state=active]:to-accent-dark data-[state=active]:text-primary-dark data-[state=active]:shadow-lg rounded-xl py-3 font-bold text-base transition-all duration-300">
            <Shield className="w-5 h-5 ml-2" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-accent data-[state=active]:to-accent-dark data-[state=active]:text-primary-dark data-[state=active]:shadow-lg rounded-xl py-3 font-bold text-base transition-all duration-300">
            <Bell className="w-5 h-5 ml-2" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-accent data-[state=active]:to-accent-dark data-[state=active]:text-primary-dark data-[state=active]:shadow-lg rounded-xl py-3 font-bold text-base transition-all duration-300">
            <Globe className="w-5 h-5 ml-2" />
            اللغة
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-8">
          <Card className="luxury-card border-2 hover:border-accent/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                المعلومات الشخصية
              </CardTitle>
              <CardDescription className="text-base">قم بتحديث معلوماتك الشخصية والمهنية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-semibold">الاسم الأول</Label>
                  <Input id="firstName" defaultValue="محمد" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-semibold">الاسم الأخير</Label>
                  <Input id="lastName" defaultValue="أحمد" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 text-base font-semibold">
                  <Mail className="w-5 h-5 text-accent" />
                  البريد الإلكتروني
                </Label>
                <Input id="email" type="email" defaultValue="admin@law-firm.com" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="flex items-center gap-2 text-base font-semibold">
                  <Phone className="w-5 h-5 text-accent" />
                  رقم الهاتف
                </Label>
                <Input id="phone" defaultValue="+966 50 123 4567" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold">المسمى الوظيفي</Label>
                <Input id="title" defaultValue="محامي رئيسي" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="license" className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="w-5 h-5 text-accent" />
                  رقم الترخيص
                </Label>
                <Input id="license" defaultValue="123456789" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Office Tab */}
        <TabsContent value="office" className="space-y-6 mt-8">
          <Card className="luxury-card border-2 hover:border-accent/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                معلومات المكتب
              </CardTitle>
              <CardDescription className="text-base">إدارة معلومات المكتب والتواصل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="officeLogo" className="flex items-center gap-2 text-base font-semibold">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  شعار المكتب
                </Label>
                <div className="flex items-center gap-4">
                  {officeLogo && (
                    <img src={officeLogo} alt="Logo" className="w-20 h-20 object-contain border-2 border-accent/30 rounded-lg" />
                  )}
                  <div className="flex-1">
                    <Input
                      id="officeLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="bg-background h-12 text-lg border-2 focus:border-accent transition-all"
                    />
                    <p className="text-sm text-muted-foreground mt-2">اختر صورة شعار المكتب (سيظهر في التقارير المطبوعة)</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label htmlFor="officeName" className="text-base font-semibold">اسم المكتب</Label>
                <Input
                  id="officeName"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="مكتب المحاماة"
                  className="bg-background h-12 text-lg border-2 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="address" className="text-base font-semibold">العنوان</Label>
                <Input
                  id="address"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  placeholder="المدينة، الدولة"
                  className="bg-background h-12 text-lg border-2 focus:border-accent transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="officePhone" className="flex items-center gap-2 text-base font-semibold">
                    <Phone className="w-5 h-5 text-accent" />
                    هاتف المكتب
                  </Label>
                  <Input
                    id="officePhone"
                    value={officePhone}
                    onChange={(e) => setOfficePhone(e.target.value)}
                    placeholder="+212 5XX XX XX XX"
                    className="bg-background h-12 text-lg border-2 focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="officeEmail" className="flex items-center gap-2 text-base font-semibold">
                    <Mail className="w-5 h-5 text-accent" />
                    البريد الإلكتروني للمكتب
                  </Label>
                  <Input
                    id="officeEmail"
                    type="email"
                    value={officeEmail}
                    onChange={(e) => setOfficeEmail(e.target.value)}
                    placeholder="info@law-office.ma"
                    className="bg-background h-12 text-lg border-2 focus:border-accent transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="website" className="flex items-center gap-2 text-base font-semibold">
                  <Globe className="w-5 h-5 text-accent" />
                  الموقع الإلكتروني
                </Label>
                <Input
                  id="website"
                  value={officeWebsite}
                  onChange={(e) => setOfficeWebsite(e.target.value)}
                  placeholder="www.law-office.ma"
                  className="bg-background h-12 text-lg border-2 focus:border-accent transition-all"
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label htmlFor="workingHours" className="flex items-center gap-2 text-base font-semibold">
                  <Clock className="w-5 h-5 text-accent" />
                  ساعات العمل
                </Label>
                <Input id="workingHours" defaultValue="الأحد - الخميس: 9:00 ص - 5:00 م" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-8">
          <Card className="luxury-card border-2 hover:border-accent/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-accent" />
                </div>
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription className="text-base">حافظ على أمان حسابك بكلمة مرور قوية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="currentPassword" className="flex items-center gap-2 text-base font-semibold">
                  <Key className="w-5 h-5 text-accent" />
                  كلمة المرور الحالية
                </Label>
                <Input id="currentPassword" type="password" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="newPassword" className="text-base font-semibold">كلمة المرور الجديدة</Label>
                <Input id="newPassword" type="password" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-base font-semibold">تأكيد كلمة المرور</Label>
                <Input id="confirmPassword" type="password" className="bg-background h-12 text-lg border-2 focus:border-accent transition-all" />
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-primary-dark font-bold h-12 text-lg shadow-lg">
                تحديث كلمة المرور
              </Button>
            </CardContent>
          </Card>

          <Card className="luxury-card border-2 hover:border-accent/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                إعدادات الأمان المتقدمة
              </CardTitle>
              <CardDescription className="text-base">خيارات أمان إضافية لحماية حسابك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all">
                <div>
                  <Label className="text-base font-semibold cursor-pointer">المصادقة الثنائية</Label>
                  <p className="text-sm text-muted-foreground mt-1">حماية إضافية لحسابك</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all">
                <div>
                  <Label className="text-base font-semibold cursor-pointer">تسجيل الخروج التلقائي</Label>
                  <p className="text-sm text-muted-foreground mt-1">بعد 30 دقيقة من عدم النشاط</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all">
                <div>
                  <Label className="text-base font-semibold cursor-pointer">إشعارات تسجيل الدخول</Label>
                  <p className="text-sm text-muted-foreground mt-1">تنبيهات عند الدخول من جهاز جديد</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-8">
          <Card className="luxury-card border-2 hover:border-accent/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-accent" />
                </div>
                إشعارات القضايا المهمة
              </CardTitle>
              <CardDescription className="text-base">تخصيص التنبيهات الصوتية والفترة الزمنية للإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all">
                <div className="flex-1">
                  <Label htmlFor="sound-enabled" className="cursor-pointer text-base font-semibold">تفعيل الصوت التنبيهي</Label>
                  <p className="text-sm text-muted-foreground mt-1">تشغيل صوت عند إرسال الإشعار</p>
                </div>
                <Switch 
                  id="sound-enabled" 
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                <Label className="text-base font-semibold">الفترة الزمنية للتنبيهات</Label>
                <p className="text-sm text-muted-foreground">إرسال إشعارات للقضايا القادمة خلال</p>
                <Select value={notificationDays} onValueChange={setNotificationDays}>
                  <SelectTrigger className="bg-background h-12 text-lg border-2 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">اليوم فقط</SelectItem>
                    <SelectItem value="1">يوم واحد مسبقاً</SelectItem>
                    <SelectItem value="2">يومين مسبقاً</SelectItem>
                    <SelectItem value="3">3 أيام مسبقاً</SelectItem>
                    <SelectItem value="7">أسبوع مسبقاً</SelectItem>
                    <SelectItem value="14">أسبوعين مسبقاً</SelectItem>
                    <SelectItem value="30">شهر مسبقاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30">
                <p className="text-sm text-foreground">
                  <strong>ملاحظة:</strong> سيتم إرسال الإشعارات مرة واحدة يومياً للقضايا المهمة. تأكد من السماح بالإشعارات في المتصفح.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6 mt-8">
          <Card className="luxury-card border-2 hover:border-accent/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                تفضيلات العرض
              </CardTitle>
              <CardDescription className="text-base">تخصيص واجهة التطبيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all">
                <div>
                  <Label className="text-base font-semibold cursor-pointer">الوضع المضغوط</Label>
                  <p className="text-sm text-muted-foreground mt-1">عرض المزيد من المحتوى في الشاشة</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all">
                <div>
                  <Label className="text-base font-semibold cursor-pointer">الرسوم المتحركة</Label>
                  <p className="text-sm text-muted-foreground mt-1">تأثيرات انتقالية سلسة</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
