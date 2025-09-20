import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { Button, Box } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// Fix for default marker icon issue which can happen with some bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LeafletSearch = ({ onLocationSelect }) => {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    });
    map.addControl(searchControl);
    map.on('geosearch/showlocation', (result) => {
        onLocationSelect({ lat: result.location.y, lng: result.location.x });
    });
    return () => map.removeControl(searchControl);
  }, [map, onLocationSelect]);
  return null;
};

const LocationHandler = ({ position, setPosition, onLocationSelect }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 16);
        }
    }, [position, map]);
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng);
      },
    });
    return position === null ? null : <Marker position={position}></Marker>;
};

const LocationPickerMap = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);

  const handleLocationSelect = (latlng) => {
    setPosition(latlng);
    onLocationSelect(latlng);
  };

  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        alert('Could not get your location. Please enable location services in your browser.');
      }
    );
  };

  const defaultPosition = [9.5743, 77.6761]; // Kalasalingam University

  return (
    <Box sx={{ position: 'relative' }}>
        <MapContainer
          center={defaultPosition}
          zoom={16}
          style={{ height: '300px', width: '100%', borderRadius: '8px' }}
          dragging={false}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
        >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationHandler position={position} setPosition={setPosition} onLocationSelect={handleLocationSelect} />
            <LeafletSearch onLocationSelect={handleLocationSelect} />
        </MapContainer>
        <Button
            variant="contained"
            startIcon={<MyLocationIcon />}
            onClick={handleGetCurrentLocation}
            sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1000,
                backgroundColor: 'white',
                color: 'black',
                '&:hover': {
                    backgroundColor: 'white',
                }
            }}
        >
            Use My Location
        </Button>
    </Box>
  );
};

export default LocationPickerMap;