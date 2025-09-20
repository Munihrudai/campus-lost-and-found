import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const findMatchingItems = async (lostItem, lostItemUserId) => {
  try {
    // 1. Fetch all 'active' and 'found' items from Firestore
    const itemsRef = collection(db, "items");
    const q = query(itemsRef, where("itemType", "==", "found"), where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No found items to compare against.");
      return; // No items to match, so we're done
    }

    const foundItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Construct a detailed prompt for the AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      You are an AI assistant for a campus lost and found app. Your task is to find potential matches for a 'lost' item from a provided list of 'found' items. Based on the lost item's title and description, analyze the list of found items. Return a JSON array containing ONLY the string IDs of the found items that are a strong potential match. If there are no strong matches, return an empty array [].
      ---
      LOST ITEM:
      Title: "${lostItem.title}", Description: "${lostItem.description}"
      ---
      LIST OF FOUND ITEMS (with their IDs):
      ${foundItems.map(item => `- ID: "${item.id}", Title: "${item.title}", Description: "${item.description}"`).join('\n')}
      ---
      JSON Array of matching IDs:
    `;

    // 3. Call the AI and get the result
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini AI Response:", text);

    // 4. Clean and parse the AI's response to get the array of IDs
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const matchedIds = JSON.parse(jsonString);

    // === NEW LOGIC: SAVE MATCHES AS NOTIFICATIONS ===
    if (matchedIds.length > 0) {
      const notificationsRef = collection(db, "notifications");
      // Create a notification for each match found
      for (const matchedId of matchedIds) {
        await addDoc(notificationsRef, {
          userId: lostItemUserId, // The user who lost the item
          message: `AI found a potential match for your item: "${lostItem.title}"`,
          itemId: matchedId, // The ID of the matched 'found' item
          isRead: false,
          timestamp: serverTimestamp(),
        });
      }
      console.log(`Saved ${matchedIds.length} new notifications.`);
    }

  } catch (error) {
    console.error("Error finding and saving matches with AI:", error);
  }
};