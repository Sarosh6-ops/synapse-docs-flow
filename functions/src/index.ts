import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

admin.initializeApp();
const db = getFirestore();
const storage = getStorage();
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

exports.analyzeDocument = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { documentId } = data;
    if (!documentId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "documentId".');
    }

    const docRef = db.collection('documents').doc(documentId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'No such document!');
    }

    await docRef.update({ status: 'processing' });

    const documentData = docSnap.data();
    const downloadUrl = documentData?.downloadUrl;
    if (!downloadUrl) {
        await docRef.update({ status: 'failed', aiSummary: 'File URL not found.' });
        throw new functions.https.HttpsError('not-found', 'File URL not found in document.');
    }

    let textContent = "";
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        textContent = await response.text();
    } catch (error) {
        functions.logger.error(`Failed to download file for document ${documentId}:`, error);
        await docRef.update({ status: 'failed', aiSummary: 'Failed to read file from storage.' });
        throw new functions.https.HttpsError('internal', 'Failed to read file.');
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
        actionItems = aiResponse.actionItems || [];
        alerts = aiResponse.alerts || [];

    } catch (error) {
        functions.logger.error(`Gemini AI or JSON parsing failed for document ${documentId}:`, error);
        await docRef.update({ status: "failed", aiSummary: "AI analysis or data parsing failed." });
        throw new functions.https.HttpsError('internal', 'AI analysis failed.');
    }

    await docRef.update({
      status: "analyzed",
      aiSummary: summary,
      actionItems: actionItems,
      alerts: alerts,
      aiScore: 90, // Placeholder
      insights: (actionItems.length + alerts.length),
    });

    return { status: 'success', message: 'Document analyzed successfully.' };
});


exports.chatWithAI = functions.https.onCall(async (data, context) => {
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
        throw new functions.https.HttpsError('internal', 'Failed to get a response from the AI.');
    }
});
