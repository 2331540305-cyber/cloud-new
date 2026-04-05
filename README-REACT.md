# CoWorking Cloud Demo - React Version

A modern React-based collaboration platform with Firebase authentication and Firestore database.

## Features
- ✅ User Authentication (Login/Register)
- ✅ Role-based Access Control (Admin/Member)
- ✅ Permission Management
- ✅ Member Management
- ✅ Tasks, Team, and File Upload pages

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── pages/           # React page components
├── config/          # Firebase and permissions config
├── styles/          # CSS files
├── App.jsx         # Main app component
└── main.jsx        # Entry point
```

## Pages

- **Login** - User authentication
- **Register** - New user registration
- **Dashboard** - Main dashboard with navigation
- **Members** - Admin panel for member management
- **Admin** - Admin-only features
- **Tasks** - Task management
- **Team** - Team collaboration
- **Upload** - File upload functionality

## Technologies

- React 18
- Vite
- Firebase
- React Router
- CSS

## License

MIT
