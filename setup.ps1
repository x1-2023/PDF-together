# Script Setup Nhanh
# Chạy script này để setup project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PDF Whiteboard - Setup Nhanh" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/6] Kiểm tra Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js chưa cài. Download tại: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "[2/6] Cài đặt dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    npm run install:all
    Write-Host "✓ Dependencies đã cài xong!" -ForegroundColor Green
} else {
    Write-Host "✗ Lỗi khi cài dependencies" -ForegroundColor Red
    exit 1
}

# Setup backend .env
Write-Host ""
Write-Host "[3/6] Tạo file cấu hình backend..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "✓ backend\.env đã tồn tại" -ForegroundColor Green
} else {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Đã tạo backend\.env" -ForegroundColor Green
}

# Setup frontend .env
Write-Host ""
Write-Host "[4/6] Tạo file cấu hình frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\.env") {
    Write-Host "✓ frontend\.env đã tồn tại" -ForegroundColor Green
} else {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Đã tạo frontend\.env" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Lưu ý: Cần thêm Discord Client ID vào frontend\.env" -ForegroundColor Yellow
    Write-Host "   Xem hướng dẫn trong HUONG-DAN-TIENG-VIET.md" -ForegroundColor Yellow
}

# Create uploads directory
Write-Host ""
Write-Host "[5/6] Tạo thư mục uploads..." -ForegroundColor Yellow
if (!(Test-Path "backend\uploads")) {
    New-Item -ItemType Directory -Path "backend\uploads" -Force | Out-Null
}
Write-Host "✓ Thư mục backend\uploads đã sẵn sàng" -ForegroundColor Green
Write-Host "  → Đặt file PDF vào đây để dùng luôn, không cần upload!" -ForegroundColor Cyan

# Final instructions
Write-Host ""
Write-Host "[6/6] Setup hoàn tất!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CÁCH CHẠY:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "  npm run dev:backend" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "  npm run dev:frontend" -ForegroundColor White
Write-Host ""
Write-Host "Sau đó mở: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ĐỂ DÙNG TRÊN DISCORD:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Đọc file: HUONG-DAN-TIENG-VIET.md" -ForegroundColor White
Write-Host "2. Tạo Discord Application" -ForegroundColor White
Write-Host "3. Thêm Client ID vào frontend\.env" -ForegroundColor White
Write-Host "4. Chạy server và test trong Discord!" -ForegroundColor White
Write-Host ""
Write-Host "Chúc may mắn! 🚀" -ForegroundColor Green
