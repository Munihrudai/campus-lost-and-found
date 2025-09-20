import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { theme } from './styles/theme';
import BottomNav from './components/layout/BottomNav';
import PrivateRoute from './routes/PrivateRoute';

// Import page components
import Home from './pages/Home';
import ExploreMap from './pages/ExploreMap';
import AddItem from './pages/AddItem';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ItemDetails from './pages/ItemDetails';
import ClaimChat from './pages/ClaimChat';

const MainLayout = () => {
  const location = useLocation();
  const showNav = !['/login', '/register'].includes(location.pathname);

  return (
    <>
      <Box sx={{ pb: showNav ? 7 : 0, p: { xs: 2, sm: 3 } }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<ExploreMap />} />
            <Route path="/add" element={<AddItem />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/item/:itemId" element={<ItemDetails />} />
            <Route path="/claim/:claimId" element={<ClaimChat />} />
          </Route>
        </Routes>
      </Box>
      {showNav && <BottomNav />}
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;