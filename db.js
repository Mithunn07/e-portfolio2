/**
 * db.js - IndexedDB storage wrapper for E-Portfolio
 * Handles persistent local storage of profile details, achievements, and documents.
 */

const DB_NAME = 'EPortfolioDB';
const DB_VERSION = 1;

// Default SVGs as Data URIs for rich premium placeholders
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238a2be2" /><stop offset="100%" stop-color="%234a00e0" /></linearGradient><clipPath id="cp"><circle cx="100" cy="100" r="90" /></clipPath></defs><rect width="200" height="200" fill="url(%23g1)"/><circle cx="100" cy="80" r="35" fill="%23ffffff" fill-opacity="0.95"/><path d="M 40 160 C 40 120, 160 120, 160 160 Z" fill="%23ffffff" fill-opacity="0.95" clip-path="url(%23cp)"/></svg>`;

const DEFAULT_ACH_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f72585" /><stop offset="100%" stop-color="%237209b7" /></linearGradient></defs><rect width="600" height="400" fill="url(%23g)"/><circle cx="450" cy="100" r="150" fill="%23ffffff" fill-opacity="0.05"/><text x="50" y="220" font-family="'Outfit', 'Inter', sans-serif" font-size="48" font-weight="800" fill="%23ffffff">AWARD 2025</text><text x="50" y="270" font-family="'Inter', sans-serif" font-size="20" fill="%23ffffff" fill-opacity="0.8">Excellence in Frontend Design</text><rect x="50" y="130" width="80" height="8" rx="4" fill="%234cc9f0"/></svg>`;

const DEFAULT_ACH_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234361ee" /><stop offset="100%" stop-color="%234cc9f0" /></linearGradient></defs><rect width="600" height="400" fill="url(%23g)"/><polygon points="50,300 250,50 450,300" fill="%23ffffff" fill-opacity="0.05"/><text x="50" y="220" font-family="'Outfit', 'Inter', sans-serif" font-size="48" font-weight="800" fill="%23ffffff">LEAD DEV</text><text x="50" y="270" font-family="'Inter', sans-serif" font-size="20" fill="%23ffffff" fill-opacity="0.8">Nexus Core Infrastructure</text><rect x="50" y="130" width="80" height="8" rx="4" fill="%23f72585"/></svg>`;

const DEFAULT_ACH_3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233f37c9" /><stop offset="100%" stop-color="%23f72585" /></linearGradient></defs><rect width="600" height="400" fill="url(%23g)"/><rect x="350" y="50" width="200" height="200" rx="30" transform="rotate(45 450 150)" fill="%23ffffff" fill-opacity="0.05"/><text x="50" y="220" font-family="'Outfit', 'Inter', sans-serif" font-size="48" font-weight="800" fill="%23ffffff">OPEN SOURCE</text><text x="50" y="270" font-family="'Inter', sans-serif" font-size="20" fill="%23ffffff" fill-opacity="0.8">5,000+ Stars Toolkit</text><rect x="50" y="130" width="80" height="8" rx="4" fill="%234cc9f0"/></svg>`;

class EPortfolioDB {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Profile store (single item keyPath: 'id')
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        
        // Achievements store (autoIncrement keys)
        if (!db.objectStoreNames.contains('achievements')) {
          db.createObjectStore('achievements', { keyPath: 'id', autoIncrement: true });
        }
        
        // Documents store (autoIncrement keys)
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        try {
          await this.seedDefaultData();
          resolve(this);
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Database helper: Perform a transaction
  getTransaction(storeName, mode) {
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // Seed default data if stores are empty
  async seedDefaultData() {
    const profileCount = await this.countItems('profile');
    if (profileCount === 0) {
      await this.saveProfile({
        id: 'main',
        name: 'Alex Morgan',
        title: 'Creative Technologist & UI Engineer',
        bio: 'I design and build immersive digital experiences that live at the intersection of aesthetic art and high-fidelity code. Specialized in modern interactive UI, CSS micro-animations, and client-side system architecture.',
        skills: ['JavaScript (ES6+)', 'HTML5 / CSS3', 'UI/UX Design', 'WebGL & Three.js', 'Performance Optimization', 'Responsive Architecture'],
        avatar: DEFAULT_AVATAR,
        githubUsername: 'alexmorgan',
        chatbotGreeting: "Hi there! I am Alex Morgan's AI assistant. Ask me anything about my expertise, key achievements, or professional documents!",
        socials: {
          github: 'https://github.com',
          linkedin: 'https://linkedin.com',
          twitter: 'https://twitter.com'
        }
      });
    }

    const achCount = await this.countItems('achievements');
    if (achCount === 0) {
      const defaultAchievements = [
        {
          title: 'Best Creative Frontend Design 2025',
          description: 'Awarded first place at the global Creative Web Awards for creating a fully immersive, 3D interactive web experiences with 60FPS animations and accessibility compliant design.',
          date: '2025-11-15',
          image: DEFAULT_ACH_1
        },
        {
          title: 'Lead Architect at Nexus Framework',
          description: 'Spearheaded the UI core rewrite of the Nexus open-source dashboard template, reducing load times by 42% and implementing modular web-components used by 15k+ developers.',
          date: '2024-03-01',
          image: DEFAULT_ACH_2
        },
        {
          title: 'Released Glassmorphic CSS Engine',
          description: 'Developed and open-sourced a lightweight CSS module for advanced glassmorphism rendering on low-spec mobile browsers. Surpassed 5k GitHub stars in 6 weeks.',
          date: '2023-08-10',
          image: DEFAULT_ACH_3
        }
      ];
      for (const ach of defaultAchievements) {
        await this.addAchievement(ach);
      }
    }

    const docCount = await this.countItems('documents');
    if (docCount === 0) {
      // Create clean text blobs as dummy files
      const resumeContent = `ALEX MORGAN - PORTFOLIO RESUME\n\nContact: alex.morgan@example.com\n\nExperience:\n- Creative Developer at Nexus (2023 - Present)\n- UI Engineer at PixelWorks (2020 - 2023)\n\nSkills:\n- Pure JavaScript, Modern CSS, IndexedDB, Canvas API`;
      const resumeBlob = new Blob([resumeContent], { type: 'text/plain' });
      
      const designBriefContent = `CREATIVE PORTFOLIO PROJECT BRIEF\n\nContains detailed project plans, mood boards, color theories (gradient selections, HSL tuning), and responsiveness matrices.`;
      const briefBlob = new Blob([designBriefContent], { type: 'text/plain' });

      await this.addDocument({
        name: 'Alex_Morgan_Resume.txt',
        type: 'text/plain',
        size: resumeBlob.size,
        date: new Date().toISOString().split('T')[0],
        fileBlob: resumeBlob
      });

      await this.addDocument({
        name: 'Creative_Design_Brief.txt',
        type: 'text/plain',
        size: briefBlob.size,
        date: new Date().toISOString().split('T')[0],
        fileBlob: briefBlob
      });
    }
  }

  // Count items helper
  countItems(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Profile methods
  getProfile() {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('profile', 'readonly');
      const request = store.get('main');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  saveProfile(profileData) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('profile', 'readwrite');
      const request = store.put({ ...profileData, id: 'main' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Achievements methods
  getAchievements() {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('achievements', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  addAchievement(ach) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('achievements', 'readwrite');
      const request = store.add(ach);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  updateAchievement(ach) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('achievements', 'readwrite');
      const request = store.put(ach);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  deleteAchievement(id) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('achievements', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Documents methods
  getDocuments() {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('documents', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  addDocument(doc) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('documents', 'readwrite');
      const request = store.add(doc);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  deleteDocument(id) {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('documents', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Expose EPortfolioDB class globally
window.EPortfolioDB = EPortfolioDB;
