# راهنمای آپلود پروژه در GitHub

## مراحل آپلود پروژه

### 1. ایجاد Repository در GitHub

1. به [GitHub.com](https://github.com) بروید و وارد حساب کاربری خود شوید
2. روی دکمه **"+"** در بالای صفحه کلیک کنید
3. **"New repository"** را انتخاب کنید
4. اطلاعات را پر کنید:
   - **Repository name**: `cat-food-reminder-pwa` (یا نام دلخواه)
   - **Description**: "یادآور غذای گربه - PWA برای مدیریت غذای گربه‌ها"
   - **Public** یا **Private** را انتخاب کنید
   - **توجه**: تیک "Initialize this repository with a README" را نزنید
5. روی **"Create repository"** کلیک کنید

### 2. آماده‌سازی پروژه محلی

#### الف) نصب Git (اگر نصب نشده)

**Windows:**
- از [git-scm.com](https://git-scm.com/download/win) دانلود کنید
- یا از PowerShell:
```powershell
winget install Git.Git
```

**بررسی نصب:**
```bash
git --version
```

#### ب) تنظیم Git (اولین بار)

```bash
git config --global user.name "نام شما"
git config --global user.email "ایمیل شما"
```

### 3. آپلود پروژه

در PowerShell یا Terminal، در پوشه پروژه (`cat-food-reminder-pwa`) دستورات زیر را اجرا کنید:

```bash
# 1. تبدیل پوشه به Git repository
git init

# 2. اضافه کردن تمام فایل‌ها
git add .

# 3. ایجاد commit اولیه
git commit -m "Initial commit: Cat Food Reminder PWA"

# 4. تغییر نام branch به main (اگر لازم باشد)
git branch -M main

# 5. اضافه کردن remote repository
# توجه: YOUR_USERNAME را با نام کاربری GitHub خود جایگزین کنید
git remote add origin https://github.com/YOUR_USERNAME/cat-food-reminder-pwa.git

# 6. آپلود به GitHub
git push -u origin main
```

**نکته:** در مرحله 6، ممکن است از شما نام کاربری و رمز عبور GitHub خواسته شود. اگر از رمز عبور استفاده می‌کنید، باید یک **Personal Access Token** ایجاد کنید (به بخش بعدی مراجعه کنید).

### 4. ایجاد Personal Access Token (اگر لازم باشد)

اگر GitHub از شما token خواست:

1. به GitHub بروید
2. Settings > Developer settings > Personal access tokens > Tokens (classic)
3. روی **"Generate new token"** کلیک کنید
4. نام token را وارد کنید (مثلاً: `cat-food-reminder`)
5. تیک **`repo`** را بزنید
6. روی **"Generate token"** کلیک کنید
7. Token را کپی کنید (فقط یک بار نمایش داده می‌شود!)
8. هنگام push، به جای رمز عبور، این token را وارد کنید

## دستورات کامل (کپی-پیست)

```bash
# در پوشه پروژه
cd C:\cat-food-reminder-pwa

# تبدیل به Git repository
git init

# اضافه کردن فایل‌ها
git add .

# Commit
git commit -m "Initial commit: Cat Food Reminder PWA"

# تغییر branch
git branch -M main

# اضافه کردن remote (YOUR_USERNAME را تغییر دهید)
git remote add origin https://github.com/YOUR_USERNAME/cat-food-reminder-pwa.git

# آپلود
git push -u origin main
```

## بعد از آپلود

### فعال‌سازی GitHub Pages

1. به repository در GitHub بروید
2. روی **"Settings"** کلیک کنید
3. در منوی سمت چپ، **"Pages"** را انتخاب کنید
4. در بخش **"Source"**:
   - **"GitHub Actions"** را انتخاب کنید
5. منتظر بمانید تا دیپلوی انجام شود (چند دقیقه)
6. بعد از دیپلوی، اپلیکیشن در آدرس زیر در دسترس خواهد بود:
   ```
   https://YOUR_USERNAME.github.io/cat-food-reminder-pwa/
   ```

## به‌روزرسانی پروژه

بعد از هر تغییر:

```bash
# اضافه کردن تغییرات
git add .

# Commit
git commit -m "توضیح تغییرات"

# آپلود
git push
```

## مشکلات رایج

### خطا: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/cat-food-reminder-pwa.git
```

### خطا: "failed to push"
- مطمئن شوید که repository در GitHub ایجاد شده است
- نام کاربری و token را بررسی کنید
- اتصال اینترنت را بررسی کنید

### خطا: "authentication failed"
- از Personal Access Token استفاده کنید (نه رمز عبور)
- Token را دوباره ایجاد کنید

## استفاده از GitHub Desktop (راه ساده‌تر)

اگر با command line راحت نیستید:

1. [GitHub Desktop](https://desktop.github.com/) را دانلود و نصب کنید
2. وارد حساب GitHub خود شوید
3. File > Add Local Repository
4. پوشه پروژه را انتخاب کنید
5. Repository > Publish repository
6. نام repository را وارد کنید و Publish را بزنید

---

**موفق باشید! 🚀**

