// مدیریت پایگاه داده IndexedDB
class Database {
    constructor() {
        this.dbName = 'CatFoodReminderDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // ایجاد store برای پروفایل‌ها
                if (!db.objectStoreNames.contains('profiles')) {
                    const profileStore = db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
                    profileStore.createIndex('name', 'name', { unique: false });
                }

                // ایجاد store برای زمان‌بندی
                if (!db.objectStoreNames.contains('schedules')) {
                    const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id', autoIncrement: true });
                    scheduleStore.createIndex('profileId', 'profileId', { unique: false });
                    scheduleStore.createIndex('time', 'time', { unique: false });
                }

                // ایجاد store برای تنظیمات
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async addProfile(profile) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        return store.add(profile);
    }

    async updateProfile(profile) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        return store.put(profile);
    }

    async deleteProfile(id) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        return store.delete(id);
    }

    async getAllProfiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readonly');
            const store = transaction.objectStore('profiles');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getProfile(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readonly');
            const store = transaction.objectStore('profiles');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        return store.put({ key, value });
    }

    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    }

    async exportData() {
        const profiles = await this.getAllProfiles();
        return {
            profiles,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    async importData(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['profiles'], 'readwrite');
            const store = transaction.objectStore('profiles');
            
            // پاک کردن داده‌های قبلی
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                // وارد کردن داده‌های جدید
                if (!data.profiles || !Array.isArray(data.profiles)) {
                    reject(new Error('فرمت داده نامعتبر است'));
                    return;
                }
                
                let completed = 0;
                const total = data.profiles.length;
                
                if (total === 0) {
                    resolve();
                    return;
                }
                
                data.profiles.forEach(profile => {
                    const addRequest = store.add(profile);
                    addRequest.onsuccess = () => {
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    };
                    addRequest.onerror = () => reject(addRequest.error);
                });
            };
            clearRequest.onerror = () => reject(clearRequest.error);
        });
    }
}

// محاسبه مقدار غذا
class FoodCalculator {
    // محاسبه نیاز کالری روزانه بر اساس فرمول RER و MER
    calculateDailyCalories(weight, age, activity) {
        // RER (Resting Energy Requirement) = 70 * (وزن به کیلوگرم) ^ 0.75
        const rer = 70 * Math.pow(weight, 0.75);
        
        // ضریب فعالیت
        let activityMultiplier = 1.2; // متوسط
        if (activity === 'low') {
            activityMultiplier = 1.0;
        } else if (activity === 'high') {
            activityMultiplier = 1.4;
        }
        
        // ضریب سن (گربه‌های جوان نیاز به کالری بیشتری دارند)
        let ageMultiplier = 1.0;
        if (age < 12) { // کمتر از 1 سال
            ageMultiplier = 1.5;
        } else if (age < 24) { // 1-2 سال
            ageMultiplier = 1.2;
        } else if (age > 120) { // بیشتر از 10 سال
            ageMultiplier = 0.9;
        }
        
        // MER (Maintenance Energy Requirement)
        const mer = rer * activityMultiplier * ageMultiplier;
        
        return Math.round(mer);
    }

    // محاسبه مقدار غذا بر اساس نوع
    calculateFoodAmount(calories, foodType) {
        // کالری متوسط غذاهای خشک: 350-400 کیلوکالری در 100 گرم
        // کالری متوسط غذاهای تر: 80-100 کیلوکالری در 100 گرم
        let caloriesPer100g;
        
        if (foodType === 'dry') {
            caloriesPer100g = 375; // میانگین
        } else if (foodType === 'wet') {
            caloriesPer100g = 90; // میانگین
        } else { // mixed: 50% خشک + 50% تر
            // محاسبه ترکیبی
            const dryCalories = calories * 0.5;
            const wetCalories = calories * 0.5;
            const dryGrams = (dryCalories / 375) * 100;
            const wetGrams = (wetCalories / 90) * 100;
            return {
                dry: Math.round(dryGrams),
                wet: Math.round(wetGrams),
                total: Math.round(dryGrams + wetGrams)
            };
        }
        
        const grams = (calories / caloriesPer100g) * 100;
        return {
            total: Math.round(grams),
            perMeal: null
        };
    }

    // تقسیم غذا به وعده‌ها
    divideIntoMeals(totalGrams, mealCount) {
        return Math.round(totalGrams / mealCount);
    }

    getRecommendation(profile) {
        const dailyCalories = this.calculateDailyCalories(
            profile.weight,
            profile.age,
            profile.activity
        );
        
        const foodAmount = this.calculateFoodAmount(dailyCalories, profile.foodType);
        const mealTimes = profile.mealTimes.split(',').map(t => t.trim()).filter(t => t);
        const mealCount = mealTimes.length;
        
        let recommendation = {
            dailyCalories,
            foodType: profile.foodType,
            mealCount,
            mealTimes
        };
        
        if (profile.foodType === 'mixed') {
            recommendation.dryGrams = foodAmount.dry;
            recommendation.wetGrams = foodAmount.wet;
            recommendation.dryPerMeal = this.divideIntoMeals(foodAmount.dry, mealCount);
            recommendation.wetPerMeal = this.divideIntoMeals(foodAmount.wet, mealCount);
        } else {
            recommendation.totalGrams = foodAmount.total;
            recommendation.gramsPerMeal = this.divideIntoMeals(foodAmount.total, mealCount);
        }
        
        return recommendation;
    }
}

// مدیریت نوتیفیکیشن
class NotificationManager {
    constructor() {
        this.permission = null;
        this.notificationIds = new Map();
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    }

    async scheduleNotifications(profile) {
        if (!await this.requestPermission()) {
            return;
        }

        const mealTimes = profile.mealTimes.split(',').map(t => t.trim()).filter(t => t);
        const calculator = new FoodCalculator();
        const recommendation = calculator.getRecommendation(profile);

        // حذف نوتیفیکیشن‌های قبلی این پروفایل
        this.cancelNotifications(profile.id);

        mealTimes.forEach((timeStr, index) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            // اگر زمان گذشته است، برای فردا تنظیم کن
            if (scheduledTime < now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            const delay = scheduledTime.getTime() - now.getTime();
            const notificationId = setTimeout(() => {
                this.showNotification(profile, recommendation, index);
                // تنظیم برای روز بعد
                this.scheduleDailyNotification(profile, recommendation, index, timeStr);
            }, delay);

            this.notificationIds.set(`${profile.id}-${index}`, notificationId);
        });
    }

    scheduleDailyNotification(profile, recommendation, mealIndex, timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const interval = 24 * 60 * 60 * 1000; // 24 ساعت

        const dailyId = setInterval(() => {
            this.showNotification(profile, recommendation, mealIndex);
        }, interval);

        this.notificationIds.set(`${profile.id}-${mealIndex}-daily`, dailyId);
    }

    showNotification(profile, recommendation, mealIndex) {
        const mealTime = recommendation.mealTimes[mealIndex];
        let message = `زمان غذا دادن به ${profile.name}!`;
        
        if (recommendation.foodType === 'mixed') {
            message += `\n${recommendation.dryPerMeal} گرم خشک + ${recommendation.wetPerMeal} گرم تر`;
        } else {
            message += `\n${recommendation.gramsPerMeal} گرم ${recommendation.foodType === 'dry' ? 'خشک' : 'تر'}`;
        }

        // تشخیص مسیر پایه برای GitHub Pages
        const basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '';
        const notificationOptions = {
            body: message,
            icon: basePath + '/icon-192.png',
            badge: basePath + '/icon-192.png',
            tag: `cat-food-${profile.id}-${mealIndex}`,
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: {
                profileId: profile.id,
                mealIndex: mealIndex
            }
        };

        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('یادآور غذای گربه', notificationOptions);
            }).catch(() => {
                // Fallback to regular notification if service worker fails
                if (Notification.permission === 'granted') {
                    new Notification('یادآور غذای گربه', notificationOptions);
                }
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('یادآور غذای گربه', notificationOptions);
        }
    }

    cancelNotifications(profileId) {
        this.notificationIds.forEach((id, key) => {
            if (key.startsWith(`${profileId}-`)) {
                clearTimeout(id);
                clearInterval(id);
                this.notificationIds.delete(key);
            }
        });
    }

    cancelAllNotifications() {
        this.notificationIds.forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        this.notificationIds.clear();
    }
}

// مدیریت اپلیکیشن
class App {
    constructor() {
        this.db = new Database();
        this.calculator = new FoodCalculator();
        this.notificationManager = new NotificationManager();
        this.currentEditingId = null;
        this.deferredPrompt = null;
    }

    async init() {
        await this.db.init();
        await this.loadSettings();
        await this.loadProfiles();
        this.setupEventListeners();
        this.setupPWA();
        this.updateSchedule();
        setInterval(() => this.updateSchedule(), 60000); // به‌روزرسانی هر دقیقه
    }

    setupEventListeners() {
        // تب‌ها
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // افزودن پروفایل
        document.getElementById('addProfileBtn').addEventListener('click', () => {
            this.openProfileModal();
        });

        // فرم پروفایل
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // بستن مودال
        document.querySelector('.close').addEventListener('click', () => {
            this.closeProfileModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeProfileModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('profileModal');
            if (e.target === modal) {
                this.closeProfileModal();
            }
        });

        // صادر/وارد
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // نوتیفیکیشن
        document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
            this.saveSetting('notificationsEnabled', e.target.checked);
            if (e.target.checked) {
                this.scheduleAllNotifications();
            } else {
                this.notificationManager.cancelAllNotifications();
            }
        });
    }

    setupPWA() {
        // نصب PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
        });

        document.getElementById('installBtn').addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('installBtn').style.display = 'none';
                }
                this.deferredPrompt = null;
            }
        });

        // ثبت Service Worker
        if ('serviceWorker' in navigator) {
            // استفاده از مسیر نسبی برای سازگاری با GitHub Pages
            const swPath = './service-worker.js';
            navigator.serviceWorker.register(swPath)
                .then(registration => {
                    console.log('Service Worker registered successfully');
                    // بررسی به‌روزرسانی‌ها
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('New service worker available. Please refresh the page.');
                            }
                        });
                    });
                })
                .catch(error => console.error('Service Worker registration failed:', error));
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (tabName === 'schedule') {
            this.updateSchedule();
        }
    }

    async loadProfiles() {
        const profiles = await this.db.getAllProfiles();
        this.renderProfiles(profiles);
    }

    renderProfiles(profiles) {
        const container = document.getElementById('profilesList');
        
        if (profiles.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">هیچ پروفایلی وجود ندارد. اولین پروفایل را اضافه کنید.</p>';
            return;
        }

        container.innerHTML = profiles.map(profile => {
            const recommendation = this.calculator.getRecommendation(profile);
            return this.createProfileCard(profile, recommendation);
        }).join('');

        // اضافه کردن event listener برای دکمه‌ها
        profiles.forEach(profile => {
            document.getElementById(`edit-${profile.id}`).addEventListener('click', () => {
                this.editProfile(profile);
            });
            document.getElementById(`delete-${profile.id}`).addEventListener('click', () => {
                this.deleteProfile(profile.id);
            });
        });
    }

    createProfileCard(profile, recommendation) {
        const activityNames = {
            low: 'کم',
            medium: 'متوسط',
            high: 'زیاد'
        };

        const foodTypeNames = {
            dry: 'خشک',
            wet: 'تر',
            mixed: 'ترکیبی'
        };

        let foodInfo = '';
        if (recommendation.foodType === 'mixed') {
            foodInfo = `
                <div class="recommendation-item">
                    <span>خشک:</span>
                    <strong>${recommendation.dryGrams} گرم (${recommendation.dryPerMeal} گرم در هر وعده)</strong>
                </div>
                <div class="recommendation-item">
                    <span>تر:</span>
                    <strong>${recommendation.wetGrams} گرم (${recommendation.wetPerMeal} گرم در هر وعده)</strong>
                </div>
            `;
        } else {
            foodInfo = `
                <div class="recommendation-item">
                    <span>مقدار روزانه:</span>
                    <strong>${recommendation.totalGrams} گرم</strong>
                </div>
                <div class="recommendation-item">
                    <span>در هر وعده:</span>
                    <strong>${recommendation.gramsPerMeal} گرم</strong>
                </div>
            `;
        }

        return `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-name">${profile.name}</div>
                    <div class="profile-actions">
                        <button class="btn btn-secondary" id="edit-${profile.id}">ویرایش</button>
                        <button class="btn btn-danger" id="delete-${profile.id}">حذف</button>
                    </div>
                </div>
                <div class="profile-info">
                    <div class="info-item">
                        <span class="info-label">وزن:</span>
                        <span class="info-value">${profile.weight} کیلوگرم</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">سن:</span>
                        <span class="info-value">${profile.age} ماه</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">فعالیت:</span>
                        <span class="info-value">${activityNames[profile.activity]}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">نوع غذا:</span>
                        <span class="info-value">${foodTypeNames[profile.foodType]}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">زمان‌های غذا:</span>
                        <span class="info-value">${profile.mealTimes}</span>
                    </div>
                </div>
                <div class="food-recommendation">
                    <h4>💡 پیشنهاد غذایی</h4>
                    <div class="recommendation-item">
                        <span>کالری روزانه:</span>
                        <strong>${recommendation.dailyCalories} کیلوکالری</strong>
                    </div>
                    ${foodInfo}
                    <div class="recommendation-item">
                        <span>تعداد وعده‌ها:</span>
                        <strong>${recommendation.mealCount} وعده</strong>
                    </div>
                </div>
            </div>
        `;
    }

    openProfileModal(profile = null) {
        const modal = document.getElementById('profileModal');
        const form = document.getElementById('profileForm');
        const title = document.getElementById('modalTitle');

        if (profile) {
            title.textContent = 'ویرایش پروفایل';
            document.getElementById('profileId').value = profile.id;
            document.getElementById('profileName').value = profile.name;
            document.getElementById('profileWeight').value = profile.weight;
            document.getElementById('profileAge').value = profile.age;
            document.getElementById('profileActivity').value = profile.activity;
            document.getElementById('profileFoodType').value = profile.foodType;
            document.getElementById('profileMealTimes').value = profile.mealTimes;
            this.currentEditingId = profile.id;
        } else {
            title.textContent = 'افزودن پروفایل جدید';
            form.reset();
            document.getElementById('profileId').value = '';
            this.currentEditingId = null;
        }

        modal.style.display = 'block';
    }

    closeProfileModal() {
        document.getElementById('profileModal').style.display = 'none';
        document.getElementById('profileForm').reset();
        this.currentEditingId = null;
    }

    async saveProfile() {
        const profile = {
            name: document.getElementById('profileName').value,
            weight: parseFloat(document.getElementById('profileWeight').value),
            age: parseInt(document.getElementById('profileAge').value),
            activity: document.getElementById('profileActivity').value,
            foodType: document.getElementById('profileFoodType').value,
            mealTimes: document.getElementById('profileMealTimes').value
        };

        if (this.currentEditingId) {
            profile.id = this.currentEditingId;
            await this.db.updateProfile(profile);
        } else {
            await this.db.addProfile(profile);
        }

        this.closeProfileModal();
        await this.loadProfiles();
        
        // برنامه‌ریزی مجدد نوتیفیکیشن‌ها
        const notificationsEnabled = await this.db.getSetting('notificationsEnabled');
        if (notificationsEnabled) {
            await this.scheduleAllNotifications();
        }
    }

    async editProfile(profile) {
        this.openProfileModal(profile);
    }

    async deleteProfile(id) {
        if (confirm('آیا از حذف این پروفایل اطمینان دارید؟')) {
            await this.db.deleteProfile(id);
            this.notificationManager.cancelNotifications(id);
            await this.loadProfiles();
            this.updateSchedule();
        }
    }

    async updateSchedule() {
        const profiles = await this.db.getAllProfiles();
        const container = document.getElementById('scheduleList');
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        if (profiles.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">هیچ زمان‌بندی‌ای وجود ندارد.</p>';
            return;
        }

        let scheduleItems = [];

        profiles.forEach(profile => {
            const mealTimes = profile.mealTimes.split(',').map(t => t.trim()).filter(t => t);
            const recommendation = this.calculator.getRecommendation(profile);

            mealTimes.forEach((timeStr, index) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                const mealTime = hours * 60 + minutes;
                const isPast = mealTime < currentTime;
                const status = isPast ? 'completed' : 'pending';

                let foodAmount = '';
                if (recommendation.foodType === 'mixed') {
                    foodAmount = `${recommendation.dryPerMeal} گرم خشک + ${recommendation.wetPerMeal} گرم تر`;
                } else {
                    foodAmount = `${recommendation.gramsPerMeal} گرم ${recommendation.foodType === 'dry' ? 'خشک' : 'تر'}`;
                }

                scheduleItems.push({
                    time: timeStr,
                    profile: profile.name,
                    food: foodAmount,
                    status,
                    mealTime
                });
            });
        });

        // مرتب‌سازی بر اساس زمان
        scheduleItems.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'pending' ? -1 : 1;
            }
            return a.mealTime - b.mealTime;
        });

        container.innerHTML = scheduleItems.map(item => `
            <div class="schedule-item">
                <div class="schedule-time">${item.time}</div>
                <div class="schedule-details">
                    <strong>${item.profile}</strong> - ${item.food}
                </div>
                <div class="schedule-status ${item.status}">
                    ${item.status === 'pending' ? 'در انتظار' : 'انجام شده'}
                </div>
            </div>
        `).join('');
    }

    async loadSettings() {
        const notificationsEnabled = await this.db.getSetting('notificationsEnabled');
        document.getElementById('notificationsEnabled').checked = notificationsEnabled || false;
        
        if (notificationsEnabled) {
            await this.scheduleAllNotifications();
        }
    }

    async saveSetting(key, value) {
        await this.db.saveSetting(key, value);
    }

    async scheduleAllNotifications() {
        const profiles = await this.db.getAllProfiles();
        for (const profile of profiles) {
            await this.notificationManager.scheduleNotifications(profile);
        }
    }

    async exportData() {
        const data = await this.db.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cat-food-reminder-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importData(file) {
        if (!file) return;

        const text = await file.text();
        const data = JSON.parse(text);

        if (confirm('آیا از وارد کردن این داده‌ها اطمینان دارید؟ داده‌های فعلی پاک خواهند شد.')) {
            await this.db.importData(data);
            await this.loadProfiles();
            this.updateSchedule();
            alert('داده‌ها با موفقیت وارد شدند.');
        }
    }
}

// راه‌اندازی اپلیکیشن
const app = new App();
app.init();

