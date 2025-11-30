#!/usr/bin/env node

/**
 * اسکریپت تولید آیکون‌های PWA
 * نیاز به canvas package دارد: npm install canvas
 * یا می‌توانید از create-icons.html استفاده کنید
 */

const fs = require('fs');
const path = require('path');

// بررسی وجود canvas
let canvas;
try {
    canvas = require('canvas');
} catch (e) {
    console.log('⚠️  پکیج canvas نصب نشده است.');
    console.log('   برای نصب: npm install canvas');
    console.log('   یا از create-icons.html در مرورگر استفاده کنید.');
    process.exit(1);
}

function createIcon(size) {
    const { createCanvas } = canvas;
    const canvasEl = createCanvas(size, size);
    const ctx = canvasEl.getContext('2d');
    
    // پس‌زمینه
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(1, '#7b68ee');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // رسم شکل گربه
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size / 20;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const headRadius = size * 0.25;
    
    // سر گربه
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // گوش چپ
    ctx.beginPath();
    ctx.moveTo(centerX - headRadius * 0.6, centerY - headRadius * 0.8);
    ctx.lineTo(centerX - headRadius * 0.3, centerY - headRadius * 1.3);
    ctx.lineTo(centerX - headRadius * 0.1, centerY - headRadius * 0.9);
    ctx.closePath();
    ctx.fill();
    
    // گوش راست
    ctx.beginPath();
    ctx.moveTo(centerX + headRadius * 0.6, centerY - headRadius * 0.8);
    ctx.lineTo(centerX + headRadius * 0.3, centerY - headRadius * 1.3);
    ctx.lineTo(centerX + headRadius * 0.1, centerY - headRadius * 0.9);
    ctx.closePath();
    ctx.fill();
    
    // چشم‌ها
    ctx.fillStyle = '#4a90e2';
    const eyeSize = size * 0.05;
    ctx.beginPath();
    ctx.arc(centerX - headRadius * 0.3, centerY - headRadius * 0.2, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + headRadius * 0.3, centerY - headRadius * 0.2, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // بینی
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - size * 0.03, centerY + size * 0.05);
    ctx.lineTo(centerX + size * 0.03, centerY + size * 0.05);
    ctx.closePath();
    ctx.fill();
    
    // دهان
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size / 40;
    ctx.beginPath();
    ctx.arc(centerX, centerY + size * 0.08, size * 0.08, 0, Math.PI);
    ctx.stroke();
    
    return canvasEl;
}

// تولید آیکون‌ها
const sizes = [192, 512];

sizes.forEach(size => {
    const icon = createIcon(size);
    const buffer = icon.toBuffer('image/png');
    const filename = `icon-${size}.png`;
    fs.writeFileSync(filename, buffer);
    console.log(`✅ ${filename} ایجاد شد`);
});

console.log('\n✨ تمام آیکون‌ها با موفقیت ایجاد شدند!');

