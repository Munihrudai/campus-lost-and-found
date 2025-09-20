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
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import moment from 'moment';

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const CommunityChat = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const chatBottomRef = useRef(null);

  // Real-time message listener
  useEffect(() => {
    const q = query(collection(db, "communityChat"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure reactions is an array to prevent errors if undefined
        reactions: doc.data().reactions || [] 
      }));
      setMessages(msgs);
      setLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching chat messages:", error);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || (!newMessage.trim() && !imageFile)) {
      return;
    }

    let imageUrl = '';
    if (imageFile) {
      setUploadingImage(true);
      try {
        const imageRef = ref(storage, `chat_images/${currentUser.uid}-${Date.now()}-${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image.");
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      await addDoc(collection(db, "communityChat"), {
        userId: currentUser.uid,
        userName: currentUser.name || currentUser.email,
        userAvatar: currentUser.photoURL || '',
        text: newMessage.trim(),
        imageUrl: imageUrl,
        timestamp: serverTimestamp(),
        reactions: [], // Initialize with an empty array
      });
      setNewMessage('');
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    if (!currentUser) return;

    const messageRef = doc(db, "communityChat", messageId);
    await updateDoc(messageRef, {
      reactions: arrayUnion({ emoji, userId: currentUser.uid, userName: currentUser.name || currentUser.email })
    });
    setEmojiAnchorEl(null); // Close emoji picker
  };

  const openEmojiPicker = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const closeEmojiPicker = () => {
    setEmojiAnchorEl(null);
  };

  if (loadingMessages) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Chat...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', p: 2 }}>
      <Typography variant="h5" align="center" gutterBottom>Community Chat</Typography>

      {/* Message Display Area */}
      <Paper elevation={3} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, mb: 2, borderRadius: 2 }}>
        {messages.map((msg) => {
          const isCurrentUser = msg.userId === currentUser?.uid;
          const reactionsMap = msg.reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
          }, {});

          return (
            <Box key={msg.id} sx={{
              display: 'flex',
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              mb: 2,
            }}>
              {!isCurrentUser && (
                <Tooltip title={msg.userName} placement="right">
                  <Avatar src={msg.userAvatar} alt={msg.userName} sx={{ mr: 1 }} />
                </Tooltip>
              )}
              <Box sx={{
                maxWidth: '70%',
                p: 1.5,
                borderRadius: 3,
                bgcolor: isCurrentUser ? 'primary.main' : 'grey.300',
                color: isCurrentUser ? 'white' : 'black',
                position: 'relative',
              }}>
                {!isCurrentUser && (
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                    {msg.userName}
                  </Typography>
                )}
                {msg.text && <Typography variant="body1">{msg.text}</Typography>}
                {msg.imageUrl && (
                  <Box sx={{ mt: msg.text ? 1 : 0 }}>
                    <img src={msg.imageUrl} alt="Chat attachment" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  </Box>
                )}
                <Typography variant="caption" sx={{
                  display: 'block',
                  textAlign: isCurrentUser ? 'right' : 'left',
                  mt: 0.5,
                  color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                }}>
                  {moment(msg.timestamp?.toDate()).calendar()}
                </Typography>

                {/* Reactions Display */}
                {Object.keys(reactionsMap).length > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{
                    position: 'absolute',
                    bottom: -10,
                    [isCurrentUser ? 'left' : 'right']: 0,
                    transform: 'translateX(50%)',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    p: '2px 6px',
                    boxShadow: 1,
                    fontSize: '0.7rem',
                  }}>
                    {Object.entries(reactionsMap).map(([emoji, count]) => (
                      <Box key={emoji} sx={{ display: 'flex', alignItems: 'center' }}>
                        {emoji} {count}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
              {isCurrentUser && (
                <Tooltip title={currentUser?.name || currentUser?.email} placement="left">
                  <Avatar src={currentUser?.photoURL} alt={currentUser?.name || currentUser?.email} sx={{ ml: 1 }} />
                </Tooltip>
              )}

              {/* Emoji Reaction Button (always visible for non-current user, on hover for current user) */}
              <IconButton size="small" onClick={openEmojiPicker} sx={{
                alignSelf: 'flex-end',
                ml: isCurrentUser ? 0 : 1,
                mr: isCurrentUser ? 1 : 0,
                color: 'text.secondary',
              }}>
                <EmojiEmotionsIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={emojiAnchorEl}
                open={Boolean(emojiAnchorEl)}
                onClose={closeEmojiPicker}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                {emojis.map((emoji, index) => (
                  <MenuItem key={index} onClick={() => handleReaction(msg.id, emoji)}>
                    {emoji}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          );
        })}
        <div ref={chatBottomRef} />
      </Paper>

      {/* Message Input Area */}
      <Paper elevation={3} sx={{ p: 2, mt: 'auto', borderRadius: 2 }}>
        {imagePreview && (
          <Box sx={{ position: 'relative', mb: 1, width: 100, height: 100, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton size="small" onClick={() => { setImageFile(null); setImagePreview(null); }} sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}>
              X
            </IconButton>
          </Box>
        )}
        <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{ mr: 1 }}
            disabled={uploadingImage}
          />
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="chat-image-upload"
            type="file"
            onChange={handleImageChange}
          />
          <label htmlFor="chat-image-upload">
            <IconButton component="span" color="primary" disabled={uploadingImage}>
              <ImageIcon />
            </IconButton>
          </label>
          <Button
            type="submit"
            variant="contained"
            endIcon={uploadingImage ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            disabled={!newMessage.trim() && !imageFile || uploadingImage}
            sx={{ ml: 1 }}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CommunityChat;