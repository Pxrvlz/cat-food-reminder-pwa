#!/usr/bin/env node

/**
 * اسکریپت تنظیم خودکار برای GitHub Pages
 * این اسکریپت manifest.json را برای دیپلوی در GitHub Pages تنظیم می‌کند
 */

const fs = require('fs');
const path = require('path');

// دریافت نام repository از environment variable یا prompt
const repoName = process.env.GITHUB_REPOSITORY 
    ? process.env.GITHUB_REPOSITORY.split('/')[1] 
    : 'cat-food-reminder-pwa';

// اگر در root دیپلوی می‌شود (username.github.io)
const isRootDeploy = repoName.endsWith('.github.io');

const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (isRootDeploy) {
    // دیپلوی در root
    manifest.start_url = '/';
    manifest.scope = '/';
} else {
    // دیپلوی در subdirectory
    manifest.start_url = `/${repoName}/`;
    manifest.scope = `/${repoName}/`;
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✅ manifest.json برای ${isRootDeploy ? 'root' : 'subdirectory'} تنظیم شد`);
console.log(`   start_url: ${manifest.start_url}`);
console.log(`   scope: ${manifest.scope}`);

