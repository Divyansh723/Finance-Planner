# Contributing to Open Finance Planner (PWA Edition)

Thanks for your interest in contributing! 🙌  
This project is an **offline-first, privacy-first finance planner** built with **Next.js + Lovable** and deployed as a **PWA**.  

---

## 🧭 How to Contribute

1. **Fork** this repo on GitHub.  
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/open-finance-planner.git
   cd open-finance-planner
   ```
3. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make your changes (see coding guidelines).  
5. **Commit your changes**:
   ```bash
   git commit -m "Add: short description of change"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Open a **Pull Request (PR)**. 🎉  

---

## 🛠 Project Setup (Local Dev)

1. Install dependencies:  
   ```bash
   npm install
   ```
2. Run development server:  
   ```bash
   npm run dev
   ```  

---

## 📐 Coding Guidelines

- **Framework**: Next.js + React.  
- **Styling**: TailwindCSS.  
- **Data storage**: IndexedDB (via Dexie.js).  
- **Charts**: Chart.js or Plotly.js.  
- **Offline-first**: Service worker + manifest.json must remain functional.  
- Keep components small, modular, and reusable.  
- Commit messages should be clear and use **imperative style**.  

---

## 📂 Branch Naming Convention

- `feature/xyz` → new features  
- `fix/xyz` → bug fixes  
- `docs/xyz` → documentation changes  
- `chore/xyz` → refactors, cleanup  

---

## 🧪 Testing

- Manual testing on both **desktop & mobile**.  
- Check **offline behavior**:  
  - Add a transaction while offline → ensure it syncs when online.  
- Verify **PWA installability**:  
  - Test `manifest.json` + `service worker`.  
- Ensure UI is responsive and dark mode works.  

---

## ✅ PR Checklist

Before submitting a PR:  
- [ ] Code runs locally (`npm run dev`).  
- [ ] Offline-first features still work.  
- [ ] PWA is installable.  
- [ ] UI is responsive on mobile.  
- [ ] Commit messages are clear.  

---

## 💡 Ways to Contribute

- Improve UI/UX (mobile-first, accessibility).  
- Add new charts or insights.  
- Enhance offline sync logic.  
- Improve dark mode and theming.  
- Write docs (README, user guides).  

---

## 📜 License

This project is open-source under the **MIT License**.  
By contributing, you agree your contributions will be licensed under the same license.  

---

🙌 Thanks for helping us build an open, privacy-first personal finance app!  
