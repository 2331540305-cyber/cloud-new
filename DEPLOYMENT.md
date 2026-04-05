# CoWorking Cloud Demo

A modern React + Vite application for coworking space management with Firebase authentication and Uploadcare file storage.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development
```bash
npm install
npm run dev
```
The app will run on `http://localhost:3000`

### Build for Production
```bash
npm run build
npm run preview
```

## 🔐 Environment Variables

Create a `.env.local` file with the following:
```
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_UPLOADCARE_PUBLIC_KEY=your_uploadcare_public_key
VITE_UPLOADCARE_SECRET_KEY=your_uploadcare_secret_key
```

## 📦 Technologies Used

- **React 18** - UI library
- **Vite 5** - Build tool
- **React Router v6** - Client-side routing
- **Firebase 10.12.2** - Authentication & Firestore database
- **Uploadcare** - Cloud file storage
- **React Icons** - SVG icon library
- **CSS Grid/Flexbox** - Responsive layouts

## 🔑 Features

- ✅ Email & Google OAuth authentication
- ✅ Role-based access control (Admin, Member, Guest)
- ✅ User management dashboard
- ✅ File upload & storage with Uploadcare
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Modern SVG icons throughout

## 📂 Project Structure

```
src/
├── pages/           # Page components (Login, Dashboard, Admin, etc.)
├── components/      # Reusable components (Layout, etc.)
├── config/          # Configuration files (Firebase, Uploadcare)
├── styles/          # Component-scoped CSS
└── App.jsx          # Main router component
```

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account with the repository pushed
- Vercel account

### Steps

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: CoWorking Cloud app"
git remote add origin https://github.com/YOUR_USERNAME/coworking-cloud-demo.git
git branch -M main
git push -u origin main
```

2. **Import to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Framework: **Vite** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configure Environment Variables**
   In Vercel Dashboard, add the following environment variables:
   ```
   VITE_API_KEY
   VITE_AUTH_DOMAIN
   VITE_PROJECT_ID
   VITE_STORAGE_BUCKET
   VITE_MESSAGING_SENDER_ID
   VITE_APP_ID
   VITE_UPLOADCARE_PUBLIC_KEY
   VITE_UPLOADCARE_SECRET_KEY
   ```

4. **Deploy**
   Click "Deploy" - Vercel will build and deploy automatically!

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## 📝 Notes

- Firebase credentials are read from environment variables for security
- `.env.local` is in `.gitignore` - never commit sensitive credentials
- `.vercel.json` configures Vercel deployment settings
- All icons are from react-icons/fi (Feather Icons)

## 🤝 Support

For issues or questions, check the console for detailed error messages.
