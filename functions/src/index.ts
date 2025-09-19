import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Cloud Storage and Firestore
const storage = getStorage();
const db = getFirestore();

// Initialize Google Gemini AI
// Make sure to set the API key in your Firebase project's configuration:
// firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

exports.processDocument = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType || "unknown";
  const bucketName = object.bucket;

  if (!filePath || !filePath.startsWith("documents/")) {
    functions.logger.log("Not a file in the documents directory, skipping.");
    return;
  }

  const fileNameWithTimestamp = filePath.split("/").pop() || "";
  const fileName = fileNameWithTimestamp.split("-").slice(1).join("-");

  if (!fileName) {
      functions.logger.error(`Could not determine file name from path: ${filePath}`);
      return;
  }

  const documentsRef = db.collection("documents");
  const q = documentsRef.where("title", "==", fileName).where("status", "==", "processing").limit(1);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    functions.logger.log(`No pending document found for file: ${fileName}`);
    return;
  }

  const documentRef = querySnapshot.docs[0].ref;

  let textContent = "";
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  if (contentType.startsWith("text/")) {
    const fileContentBuffer = await file.download();
    textContent = fileContentBuffer.toString("utf8");
  } else {
    functions.logger.log(`Unsupported content type: ${contentType}. Skipping AI processing.`);
    await documentRef.update({
      status: "failed",
      aiSummary: "File type not supported for AI analysis.",
    });
    return;
  }

  if (!textContent) {
    functions.logger.log("No text content found in the file.");
    await documentRef.update({
        status: "failed",
        aiSummary: "Could not extract any text from the document.",
    });
    return;
  }

  let summary = "Could not generate summary.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Summarize this document and identify key insights: "${textContent}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    summary = response.text();
  } catch (error) {
    functions.logger.error("Gemini AI failed:", error);
    await documentRef.update({ status: "failed", aiSummary: "AI analysis failed." });
    return;
  }

  await documentRef.update({
    status: "analyzed",
    aiSummary: summary,
    aiScore: 90, // Placeholder
    insights: 5, // Placeholder
  });

  functions.logger.log(`Successfully processed ${filePath} and updated document ${documentRef.id}.`);
});
