import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

// Callable function for AI Chat
exports.chatWithAI = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const userMessage = data.message;
    if (typeof userMessage !== 'string' || userMessage.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a non-empty "message" string.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        return { response: text };
    } catch (error) {
        functions.logger.error("Gemini AI failed in chat:", error);
        throw new functions.https.HttpsError('internal', 'Failed to get a response from the AI. Please try again later.');
    }
});
