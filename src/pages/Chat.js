import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../api/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import {
  Box, TextField, Button, Typography, Paper, Avatar,
  IconButton, CircularProgress, Tooltip, Stack, Menu, MenuItem
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import moment from 'moment';

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const Chat = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for emoji picker
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "communityChat"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || (!newMessage.trim() && !imageFile)) return;

    setUploading(true);
    let imageUrl = '';
    if (imageFile) {
      try {
        const imageRef = ref(storage, `chat_images/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading image:", error);
        setUploading(false);
        return;
      }
    }

    await addDoc(collection(db, "communityChat"), {
      userId: currentUser.uid,
      userName: currentUser.name || currentUser.email,
      userAvatar: currentUser.photoURL || '',
      text: newMessage.trim(),
      imageUrl,
      timestamp: serverTimestamp(),
      reactions: [],
    });

    setNewMessage('');
    setImageFile(null);
    setImagePreview(null);
    setUploading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleReaction = async (emoji) => {
    if (!selectedMessageId) return;
    const messageRef = doc(db, "communityChat", selectedMessageId);
    // Find if user already reacted with this emoji
    const message = messages.find(m => m.id === selectedMessageId);
    const existingReaction = message.reactions?.find(r => r.userId === currentUser.uid && r.emoji === emoji);

    if (existingReaction) {
        // Here you could implement logic to remove a reaction, but for now we'll keep it simple
        console.log("Already reacted with this emoji.");
    } else {
        await updateDoc(messageRef, {
            reactions: arrayUnion({ emoji, userId: currentUser.uid, userName: currentUser.name || currentUser.email })
        });
    }
    handleCloseEmojiPicker();
  };

  const handleOpenEmojiPicker = (event, messageId) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleCloseEmojiPicker = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };

  if (loading) { /* ... Loading spinner ... */ }

  return (
    <Box sx={{ height: 'calc(100vh - 56px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom align="center">Community Chat</Typography>
      <Paper sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg) => {
          const isCurrentUser = msg.userId === currentUser.uid;
          const reactionsMap = msg.reactions?.reduce((acc, reaction) => {
              acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
              return acc;
          }, {}) || {};

          return (
            <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', mb: 2, gap: 1 }}>
              {!isCurrentUser && <Avatar src={msg.userAvatar} />}
              <Box>
                {!isCurrentUser && <Typography variant="caption" color="text.secondary" sx={{ml:1.5}}>{msg.userName}</Typography>}
                <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: isCurrentUser ? 'primary.main' : 'background.paper', color: isCurrentUser ? 'primary.contrastText' : 'text.primary', position: 'relative' }}>
                  {msg.imageUrl && <img src={msg.imageUrl} alt="chat attachment" style={{ maxWidth: '200px', borderRadius: '8px', display: 'block', marginBottom: '8px' }} />}
                  {msg.text && <Typography variant="body1">{msg.text}</Typography>}
                  {msg.reactions?.length > 0 && 
                    <Paper sx={{position:'absolute', bottom: -12, left: isCurrentUser ? 'auto' : 12, right: isCurrentUser ? 12: 'auto', p:'2px 6px', borderRadius: '12px'}}>
                        <Stack direction="row" spacing={0.5}>
                            {Object.entries(reactionsMap).map(([emoji, count]) => <Typography key={emoji} variant="caption">{emoji} {count}</Typography>)}
                        </Stack>
                    </Paper>
                  }
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: isCurrentUser ? 'right' : 'left', display: 'block', px: 1.5, pt: msg.reactions?.length > 0 ? 1.5 : 0 }}>
                    {msg.timestamp ? moment(msg.timestamp.toDate()).format('LT') : 'sending...'}
                </Typography>
              </Box>
              <IconButton size="small" onClick={(e) => handleOpenEmojiPicker(e, msg.id)}><AddReactionIcon fontSize="small" /></IconButton>
              {isCurrentUser && <Avatar src={currentUser.photoURL} />}
            </Box>
          )
        })}
        <div ref={scrollRef}></div>
      </Paper>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseEmojiPicker}>
        {emojis.map(emoji => <MenuItem key={emoji} onClick={() => handleReaction(emoji)}>{emoji}</MenuItem>)}
      </Menu>
      <Paper component="form" onSubmit={handleSendMessage} sx={{ p: '8px 16px', mt: 1, display: 'flex', alignItems: 'center' }}>
        <input accept="image/*" style={{ display: 'none' }} id="chat-image-input" type="file" onChange={handleImageChange}/>
        <label htmlFor="chat-image-input">
            <IconButton component="span" disabled={uploading}><ImageIcon/></IconButton>
        </label>
        <TextField fullWidth variant="standard" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} InputProps={{ disableUnderline: true }}/>
        <IconButton type="submit" color="primary" disabled={uploading}>{uploading ? <CircularProgress size={24}/> : <SendIcon />}</IconButton>
      </Paper>
    </Box>
  );
};

export default Chat;