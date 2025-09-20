import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { db } from '../api/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; // Removed 'where'
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Icon fix...
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ExploreMap = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // === THIS QUERY IS NOW SIMPLER TO FETCH ALL ITEMS ===
    const q = query(collection(db, "items"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.location && item.location.latitude && item.location.longitude);
      setItems(itemsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Map...</Typography>
      </Box>
    );
  }

  const defaultPosition = [9.5743, 77.6761]; // Kalasalingam University

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Explore Items on Map
      </Typography>
      <Paper elevation={4} sx={{ height: '75vh', width: '100%', borderRadius: 3, overflow: 'hidden' }}>
        <MapContainer center={defaultPosition} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          <MarkerClusterGroup>
            {items.map(item => (
              <Marker key={item.id} position={[item.location.latitude, item.location.longitude]}>
                <Popup>
                  <Box sx={{ width: 200 }}>
                    <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Status:</strong> {item.status}</Typography>
                    <Button component={RouterLink} to={`/item/${item.id}`} variant="contained" size="small" sx={{ mt: 1.5, width: '100%' }}>
                      View Details
                    </Button>
                  </Box>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </Paper>
    </Box>
  );
};

export default ExploreMap;