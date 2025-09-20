import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, Paper, Avatar, Grid, IconButton, CircularProgress, Container } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../api/firebase';
import { signOut } from 'firebase/auth'; // <-- Make sure signOut is imported
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { uploadImageToCloudinary } from '../api/cloudinary';
import EditProfileModal from '../components/profile/EditProfileModal';
import ItemCard from '../components/items/ItemCard';
import ClaimCard from '../components/profile/ClaimCard';

const Profile = () => {
  const { currentUser, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [myItems, setMyItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    // ... useEffect logic for fetching items and claims is the same
    const itemsQuery = query(collection(db, "items"), where("userId", "==", currentUser.uid), orderBy("timestamp", "desc"));
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      setMyItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const claimsAsClaimerQuery = query(collection(db, "claims"), where("claimerId", "==", currentUser.uid));
    const unsubscribeClaimsAsClaimer = onSnapshot(claimsAsClaimerQuery, (snapshot) => {
      const claimsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClaims(prevClaims => [...prevClaims.filter(c => c.finderId === currentUser.uid), ...claimsData]);
    });
    const claimsAsFinderQuery = query(collection(db, "claims"), where("finderId", "==", currentUser.uid));
    const unsubscribeClaimsAsFinder = onSnapshot(claimsAsFinderQuery, (snapshot) => {
      const claimsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       setClaims(prevClaims => [...prevClaims.filter(c => c.claimerId === currentUser.uid), ...claimsData]);
    });
    return () => {
      unsubscribeItems();
      unsubscribeClaimsAsClaimer();
      unsubscribeClaimsAsFinder();
    };
  }, [currentUser]);

  // === THIS IS THE CORRECTED FUNCTION ===
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Failed to log out. Please try again.");
    }
  };
  
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const photoURL = await uploadImageToCloudinary(file);
      if (photoURL) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { photoURL });
        await refetchUser();
        alert('Profile picture updated!');
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert('Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser || loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  // The JSX for the return statement is the same as the last correct version
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <EditProfileModal open={openEditModal} handleClose={() => setOpenEditModal(false)} user={currentUser} refetchUser={refetchUser} />
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3, mb: 2 }}>
            <Box sx={{ position: 'relative', width: 150, height: 150, mb: 2 }}><Avatar src={currentUser.photoURL} sx={{ width: '100%', height: '100%', fontSize: '4rem', boxShadow: 3 }}>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : ''}</Avatar><IconButton color="primary" aria-label="upload picture" component="label" sx={{ position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'white' } }}><input hidden accept="image/*" type="file" onChange={handleProfilePictureChange} />{uploading ? <CircularProgress size={24} /> : <PhotoCamera />}</IconButton></Box>
            <Typography variant="h5" fontWeight="bold">{currentUser.name}</Typography><Typography color="text.secondary">{currentUser.email}</Typography><Box sx={{ textAlign: 'center', mt: 2 }}><Typography color="text.secondary">Dept: {currentUser.department} | Section: {currentUser.section}</Typography><Typography color="text.secondary">Reg No: {currentUser.registerNumber}</Typography></Box>
            <Button variant="outlined" startIcon={<EditIcon />} sx={{ mt: 3, borderRadius: 20 }} onClick={() => setOpenEditModal(true)}>Edit Profile</Button>
          </Paper>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>My Claims & Conversations</Typography>
            {claims.length > 0 ? (
              claims.map(claim => <ClaimCard key={claim.id} claim={claim} currentUserId={currentUser.uid} />)
            ) : (
              <Typography variant="body2" color="text.secondary">You have no active claims.</Typography>
            )}
          </Paper>
          <Button variant="contained" color="error" onClick={handleLogout} sx={{ mt: 2, width: '100%', borderRadius: 3 }}>
            Log Out
          </Button>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom>My Reported Items</Typography>
            {myItems.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {myItems.map(item => <ItemCard key={item.id} item={item} />)}
              </Box>
            ) : (
              <Typography sx={{ mt: 3, textAlign: 'center' }}>You have not reported any items yet.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;