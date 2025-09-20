import React, { useState, useEffect } from 'react';
import { Typography, Box, Container, CircularProgress, Tabs, Tab } from '@mui/material';
import { db } from '../api/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import ItemCard from '../components/items/ItemCard';

const Home = () => {
  const [activeItems, setActiveItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  // Listener for 'active' items
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "items"), where("status", "==", "active"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // Listener for 'returned' items
  useEffect(() => {
    const q = query(collection(db, "items"), where("status", "==", "returned"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClaimedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const renderItems = (items) => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }
    if (items.length === 0) {
      return <Typography sx={{ mt: 4, textAlign: 'center' }}>No items found in this category.</Typography>;
    }
    return (
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {items.map(item => <ItemCard key={item.id} item={item} />)}
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Campus Feed
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="item status tabs">
          <Tab label="Latest" />
          <Tab label="Claimed" />
        </Tabs>
      </Box>
      
      {/* Show content based on selected tab */}
      {tabIndex === 0 && renderItems(activeItems)}
      {tabIndex === 1 && renderItems(claimedItems)}
    </Container>
  );
};

export default Home;