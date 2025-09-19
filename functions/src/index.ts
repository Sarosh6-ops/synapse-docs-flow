import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = getFirestore();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

// Function to process uploaded documents
exports.processDocument = functions.firestore.document('documents/{documentId}')
  .onCreate(async (snap, context) => {
    const newDocument = snap.data();
    const { documentId } = context.params;
    const { downloadUrl, status } = newDocument;

    if (status !== 'processing') {
      functions.logger.log(`Document ${documentId} is not in 'processing' state. Skipping.`);
      return null;
    }

    let textContent = "";
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      textContent = await response.text();
    } catch (error) {
      functions.logger.error(`Failed to download file for document ${documentId}:`, error);
      return db.collection('documents').doc(documentId).update({
        status: 'failed',
        aiSummary: 'Failed to read file from storage.',
      });
    }

    if (!textContent) {
      functions.logger.log(`No text content in file for document ${documentId}.`);
      return db.collection('documents').doc(documentId).update({
        status: 'failed',
        aiSummary: 'Could not extract text from document.',
      });
    }

    let summary = 'Could not generate summary.';
    let actionItems: string[] = [];
    let alerts: string[] = [];

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Analyze the following document. Provide a concise summary, a list of key action items, and a list of any potential alerts or risks. Format the output as a single JSON object with three keys: "summary", "actionItems", and "alerts".\n\nDOCUMENT:\n"""${textContent}"""`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(jsonString);

      summary = aiResponse.summary || summary;
      actionItems = aiResponse.actionItems || actionItems;
      alerts = aiResponse.alerts || alerts;

    } catch (error) {
      functions.logger.error(`Gemini AI or JSON parsing failed for document ${documentId}:`, error);
      return db.collection('documents').doc(documentId).update({ status: "failed", aiSummary: "AI analysis or data parsing failed." });
    }

    return db.collection('documents').doc(documentId).update({
      status: "processed",
      aiSummary: summary,
      actionItems: actionItems,
      alerts: alerts,
      aiScore: 90, // Placeholder
      insights: (actionItems.length + alerts.length),
    });
});

// Callable function for AI Chat
exports.chatWithAI = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const userMessage = data.message;
    if (!userMessage) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "message" containing the message text.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        return { response: text };
    } catch (error) {
        functions.logger.error("Gemini AI failed in chat:", error);
        throw new functions.https.HttpsError('internal', 'Failed to get a response from the AI.');
    }
});
