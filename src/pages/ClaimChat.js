import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Box, Button, Paper, Typography, CircularProgress, Avatar, TextField, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import { db } from '../api/firebase';
import { doc, collection, query, orderBy, onSnapshot, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/chat/ChatMessage';

const ClaimChat = () => {
  const { claimId } = useParams();
  const { currentUser } = useAuth();
  const [claim, setClaim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    const claimDocRef = doc(db, 'claims', claimId);
    const unsubscribe = onSnapshot(claimDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const claimData = { id: docSnap.id, ...docSnap.data() };
        if (currentUser.uid === claimData.claimerId || currentUser.uid === claimData.finderId) {
          setClaim(claimData);
        } else {
          setUnauthorized(true);
        }
      } else {
        setUnauthorized(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [claimId, currentUser.uid]);

  useEffect(() => {
    if (!claim) return;
    const messagesRef = collection(db, 'claims', claimId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [claim]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;
    const messagesRef = collection(db, 'claims', claimId, 'messages');
    await addDoc(messagesRef, {
      text: newMessage,
      timestamp: serverTimestamp(),
      uid: currentUser.uid,
      userName: currentUser.name,
      photoURL: currentUser.photoURL || null,
    });
    setNewMessage('');
  };

  const handleClaimResolution = async (newStatus) => {
    const isApproved = newStatus === 'approved';
    try {
      const claimDocRef = doc(db, 'claims', claimId);
      await updateDoc(claimDocRef, { status: newStatus });
      const itemDocRef = doc(db, 'items', claim.itemId);
      await updateDoc(itemDocRef, { status: isApproved ? 'returned' : 'active' });
      alert(`Claim has been ${newStatus}.`);
    } catch (error) {
      console.error("Error resolving claim:", error);
      alert('Failed to update claim status.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (unauthorized) {
    return <Navigate to="/" />;
  }

  if (!claim) {
    return (
      <Typography align="center" sx={{ mt: 5 }}>
        Claim not found.
      </Typography>
    );
  }

  const isFinder = currentUser.uid === claim.finderId;
  const isClaimResolved = claim.status === 'approved' || claim.status === 'rejected';

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Claim Discussion
      </Typography>
      <Paper elevation={4} sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Avatar src={claim.itemImageUrl} variant="rounded" sx={{ width: 56, height: 56, mr: 2 }} />
          <Box>
            <Typography variant="h6">{claim.itemTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {claim.status.replace('_', ' ').toUpperCase()}
            </Typography>
          </Box>
        </Box>
        
        {isFinder && !isClaimResolved && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2, backgroundColor: 'action.hover' }}>
            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleClaimResolution('approved')}>
              Approve Claim
            </Button>
            <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={() => handleClaimResolution('rejected')}>
              Reject Claim
            </Button>
          </Box>
        )}
        
        <Box sx={{ height: '60vh', flex: 1, overflowY: 'auto', p: 2 }}>
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={scrollRef}></div>
        </Box>
        
        {isClaimResolved ? (
          <Typography sx={{ p: 2, textAlign: 'center', backgroundColor: 'action.disabledBackground' }}>
            This claim has been resolved. Chat is disabled.
          </Typography>
        ) : (
          <Box component="form" onSubmit={handleSendMessage} sx={{ p: '8px 16px', display: 'flex', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              variant="standard"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              InputProps={{ disableUnderline: true }}
            />
            <IconButton type="submit" color="primary">
              <SendIcon />
            </IconButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClaimChat;