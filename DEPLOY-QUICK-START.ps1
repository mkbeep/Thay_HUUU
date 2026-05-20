# ============================================
# SCRIPT DEPLOY NHANH LÊN GITHUB
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY DỰ ÁN LÊN GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Git
Write-Host "Kiểm tra Git..." -ForegroundColor Yellow
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Host "❌ Git chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Vui lòng tải Git tại: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Git đã cài đặt: $gitVersion" -ForegroundColor Green
Write-Host ""

# Nhập thông tin GitHub
Write-Host "Nhập thông tin GitHub của bạn:" -ForegroundColor Yellow
$githubUsername = Read-Host "GitHub Username"
$repoName = Read-Host "Tên Repository (mặc định: restaurant-management-system)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "restaurant-management-system"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chuẩn bị push code lên GitHub..." -ForegroundColor Yellow
Write-Host "Repository: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Xác nhận
$confirm = Read-Host "Bạn đã tạo repository trên GitHub chưa? (y/n)"
if ($confirm -ne "y") {
    Write-Host ""
    Write-Host "Vui lòng làm theo các bước sau:" -ForegroundColor Yellow
    Write-Host "1. Truy cập: https://github.com/new" -ForegroundColor White
    Write-Host "2. Tên repository: $repoName" -ForegroundColor White
    Write-Host "3. Chọn Public" -ForegroundColor White
    Write-Host "4. KHÔNG chọn 'Initialize with README'" -ForegroundColor White
    Write-Host "5. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "Sau khi tạo xong, chạy lại script này!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Bắt đầu push code..." -ForegroundColor Yellow
Write-Host ""

# Khởi tạo Git (nếu chưa có)
if (-not (Test-Path ".git")) {
    Write-Host "Khởi tạo Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Đã khởi tạo Git" -ForegroundColor Green
}

# Add tất cả files
Write-Host "Thêm files vào Git..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Commit changes..." -ForegroundColor Yellow
$commitMessage = Read-Host "Commit message (mặc định: Initial commit)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit - Restaurant Management System"
}
git commit -m "$commitMessage"
Write-Host "✅ Đã commit" -ForegroundColor Green

# Thêm remote
Write-Host "Thêm remote repository..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$githubUsername/$repoName.git"
git remote remove origin 2>$null
git remote add origin $remoteUrl
Write-Host "✅ Đã thêm remote: $remoteUrl" -ForegroundColor Green

# Đổi branch sang main
Write-Host "Đổi branch sang main..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Đã đổi sang branch main" -ForegroundColor Green

# Push lên GitHub
Write-Host ""
Write-Host "Đang push lên GitHub..." -ForegroundColor Yellow
Write-Host "(Bạn có thể cần nhập username và password/token GitHub)" -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ PUSH THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "BƯỚC TIẾP THEO:" -ForegroundColor Yellow
    Write-Host "1. Đọc file HUONG-DAN-DEPLOY.md" -ForegroundColor White
    Write-Host "2. Deploy Backend lên Render.com" -ForegroundColor White
    Write-Host "3. Deploy Admin-web lên Vercel" -ForegroundColor White
    Write-Host "4. Deploy App lên Vercel" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push thất bại!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Có thể do:" -ForegroundColor Yellow
    Write-Host "- Chưa đăng nhập GitHub" -ForegroundColor White
    Write-Host "- Repository chưa được tạo" -ForegroundColor White
    Write-Host "- Không có quyền truy cập" -ForegroundColor White
    Write-Host ""
    Write-Host "Thử chạy lệnh sau để đăng nhập:" -ForegroundColor Yellow
    Write-Host "git config --global user.name 'Your Name'" -ForegroundColor Cyan
    Write-Host "git config --global user.email 'your.email@example.com'" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Nhấn Enter để thoát..."
Read-Host
