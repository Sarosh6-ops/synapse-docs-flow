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

// Function to process uploaded documents
exports.processDocument = functions.firestore.document('documents/{documentId}').onCreate(async (snap, context) => {
    const documentData = snap.data();
    const documentId = context.params.documentId;

    if (!documentData) {
        functions.logger.error('No data associated with the event');
        return;
    }

    const storagePath = documentData.storagePath;
    const fileType = documentData.type;

    if (!storagePath) {
        functions.logger.error('No storagePath found on the document');
        await snap.ref.update({ status: 'failed', error: 'File path not found.' });
        return;
    }

    try {
        // 1. Download the file from Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);

        const [fileBuffer] = await file.download();

        // 2. Extract text based on file type
        let text = '';
        if (fileType === 'application/pdf') {
            const pdf = await import('pdf-parse');
            const data = await pdf.default(fileBuffer);
            text = data.text;
        } else {
            functions.logger.warn(`Unsupported file type: ${fileType}`);
            await snap.ref.update({ status: 'failed', error: 'Unsupported file type' });
            return;
        }

        if (!text) {
            throw new Error("Failed to extract text from the document.");
        }

        functions.logger.log("Extracted text, length:", text.length);

        // 3. Analyze with Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
            Analyze the following document text and provide a structured JSON response.
            The JSON should have the following keys: "summary", "keyPoints" (an array of strings), "actionItems" (an array of objects with "priority" (high/medium/low), "item", and "department" keys), "alerts" (an array of objects with "type" (warning/info) and "message" keys), and "confidence" (a number between 0 and 100 representing your confidence in the analysis).

            Document Text:
            ---
            ${text.substring(0, 10000)}
            ---
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Clean the response to make it valid JSON
        const jsonString = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
        const aiData = JSON.parse(jsonString);

        // 4. Update Firestore with the analysis
        await snap.ref.update({
            status: 'analyzed',
            summary: aiData.summary,
            keyPoints: aiData.keyPoints,
            actionItems: aiData.actionItems,
            alerts: aiData.alerts,
            aiScore: aiData.confidence,
            insights: (aiData.keyPoints?.length || 0) + (aiData.actionItems?.length || 0) + (aiData.alerts?.length || 0),
        });

        functions.logger.log(`Successfully processed document ${documentId}`);

    } catch (error) {
        functions.logger.error(`Error processing document ${documentId}:`, error);
        await snap.ref.update({ status: 'failed', error: (error as Error).message });
    }
});
