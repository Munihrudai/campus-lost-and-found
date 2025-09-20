import React from 'react';
import { Card, CardHeader, CardMedia, CardContent, Typography, Avatar, Chip, Box } from '@mui/material';
import { red, green } from '@mui/material/colors';
import { Link as RouterLink } from 'react-router-dom';

const ItemCard = ({ item }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    return timestamp.toDate().toLocaleString();
  };

  const userInitial = item.userName ? item.userName.charAt(0).toUpperCase() : '?';
  const isReturned = item.status === 'returned';

  return (
    <Card 
      component={isReturned ? 'div' : RouterLink} // Make it a plain div if returned
      to={`/item/${item.id}`}
      sx={{ 
        maxWidth: 550, 
        width: '100%', 
        mb: 4, 
        borderRadius: 3, 
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
        textDecoration: 'none',
        position: 'relative', // Needed for the "Returned" badge
        cursor: isReturned ? 'default' : 'pointer',
        '&:hover': {
          transform: isReturned ? 'none' : 'translateY(-4px)',
          boxShadow: isReturned ? '0 4px 12px 0 rgba(0,0,0,0.05)' : '0 8px 16px 0 rgba(0,0,0,0.1)',
        },
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* === NEW "RETURNED" BADGE === */}
      {isReturned && (
        <Chip 
          label="Returned" 
          color="success" 
          sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            zIndex: 1,
            fontWeight: 'bold',
          }} 
        />
      )}

      <CardHeader
        avatar={<Avatar sx={{ bgcolor: red[500] }}>{userInitial}</Avatar>}
        title={<Typography variant="subtitle1" fontWeight="bold">{item.userName}</Typography>}
        subheader={formatDate(item.timestamp)}
      />
      <CardMedia
        component="img"
        height="400"
        image={item.imageUrl}
        alt={item.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {item.title}
          </Typography>
          <Chip 
            label={item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} 
            color={item.itemType === 'lost' ? 'error' : 'success'}
          />
        </div>
        <Typography variant="body2" color="text.secondary">
          <strong>Category:</strong> {item.category}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ItemCard;