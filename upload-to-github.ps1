# اسکریپت آپلود خودکار به GitHub
# استفاده: .\upload-to-github.ps1 -Username "YOUR_USERNAME" -RepoName "cat-food-reminder-pwa"

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "cat-food-reminder-pwa"
)

Write-Host "🚀 شروع آپلود پروژه به GitHub..." -ForegroundColor Green

# بررسی وجود Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git پیدا شد: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git نصب نشده است!" -ForegroundColor Red
    Write-Host "لطفاً Git را از https://git-scm.com/download/win نصب کنید" -ForegroundColor Yellow
    exit 1
}

# بررسی اینکه آیا Git repository است یا نه
if (-not (Test-Path ".git")) {
    Write-Host "📦 تبدیل پوشه به Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ خطا در git init" -ForegroundColor Red
        exit 1
    }
}

# اضافه کردن فایل‌ها
Write-Host "📝 اضافه کردن فایل‌ها..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ خطا در git add" -ForegroundColor Red
    exit 1
}

# بررسی تغییرات
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  هیچ تغییراتی برای commit وجود ندارد" -ForegroundColor Yellow
} else {
    Write-Host "💾 ایجاد commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: Cat Food Reminder PWA"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ خطا در git commit" -ForegroundColor Red
        exit 1
    }
}

# تغییر branch به main
Write-Host "🌿 تنظیم branch به main..." -ForegroundColor Yellow
git branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  خطا در تغییر branch (ممکن است قبلاً main باشد)" -ForegroundColor Yellow
}

# بررسی remote
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Remote origin از قبل وجود دارد: $remote" -ForegroundColor Yellow
    $response = Read-Host "آیا می‌خواهید آن را جایگزین کنید؟ (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git remote remove origin
    } else {
        Write-Host "❌ عملیات لغو شد" -ForegroundColor Red
        exit 1
    }
}

# اضافه کردن remote
$repoUrl = "https://github.com/$Username/$RepoName.git"
Write-Host "🔗 اضافه کردن remote: $repoUrl" -ForegroundColor Yellow
git remote add origin $repoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ خطا در اضافه کردن remote" -ForegroundColor Red
    exit 1
}

# Push
Write-Host "⬆️  آپلود به GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  توجه: ممکن است از شما نام کاربری و رمز عبور (یا token) خواسته شود" -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ پروژه با موفقیت آپلود شد!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 مراحل بعدی:" -ForegroundColor Cyan
    Write-Host "1. به https://github.com/$Username/$RepoName بروید" -ForegroundColor White
    Write-Host "2. Settings > Pages را باز کنید" -ForegroundColor White
    Write-Host "3. Source را روی 'GitHub Actions' تنظیم کنید" -ForegroundColor White
    Write-Host "4. منتظر بمانید تا دیپلوی انجام شود" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 آدرس اپلیکیشن بعد از دیپلوی:" -ForegroundColor Cyan
    Write-Host "https://$Username.github.io/$RepoName/" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ خطا در push" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 راه‌حل‌های احتمالی:" -ForegroundColor Yellow
    Write-Host "1. مطمئن شوید که repository در GitHub ایجاد شده است" -ForegroundColor White
    Write-Host "2. اگر از رمز عبور استفاده می‌کنید، باید Personal Access Token ایجاد کنید" -ForegroundColor White
    Write-Host "3. راهنمای کامل در فایل GITHUB_SETUP.md موجود است" -ForegroundColor White
}

