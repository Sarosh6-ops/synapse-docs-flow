import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

const db = admin.firestore();
const visionClient = new ImageAnnotatorClient();
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

export const invoiceExtractor = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;

  if (!contentType?.startsWith("image/")) {
    return functions.logger.log("This is not an image.");
  }
  if (!filePath) {
      return functions.logger.log("File path not found.");
  }

  const bucketName = object.bucket;
  const bucket = admin.storage().bucket(bucketName);
  const gcsUri = `gs://${bucketName}/${filePath}`;

  const [result] = await visionClient.textDetection(gcsUri);
  const detections = result.textAnnotations;
  const text = detections?.[0]?.description || "";

  const docId = filePath.split("/").pop()?.split(".")[0]
  if(!docId) {
      functions.logger.log("Could not determine document ID.");
      return;
  }
  const documents = await db.collection("documents").where("title", "==", docId).get();
  if (documents.empty) {
      functions.logger.log("No matching documents found.");
      return;
  }
  const docRef = documents.docs[0].ref;


  await docRef.update({
    status: "analyzed",
    content: text,
    aiScore: 90, // Placeholder
  });

  await docRef.collection("insights").add({
      summary: "This is a summary from the invoice extractor.",
      keyPoints: ["Point 1", "Point 2"],
      actionItems: [],
      alerts: [],
      confidence: 90,
      processingTime: "1.2 seconds",
  });
});

export const documentSummarizer = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    if (contentType?.startsWith("image/")) {
        return functions.logger.log("This is an image, skipping summarization.");
    }
    if (!filePath) {
        return functions.logger.log("File path not found.");
    }

    const bucketName = object.bucket;
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);
    const fileContent = (await file.download()).toString();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Summarize the following document:\n\n${fileContent}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    const docId = filePath.split("/").pop()?.split(".")[0]
    if(!docId) {
        functions.logger.log("Could not determine document ID.");
        return;
    }
    const documents = await db.collection("documents").where("title", "==", docId).get();
    if (documents.empty) {
        functions.logger.log("No matching documents found.");
        return;
    }
    const docRef = documents.docs[0].ref;


    await docRef.update({
        status: "analyzed",
        content: fileContent,
        aiScore: 95, // Placeholder
    });

    await docRef.collection("insights").add({
        summary: summary,
        keyPoints: ["Point 1 from Gemini", "Point 2 from Gemini"],
        actionItems: [],
        alerts: [],
        confidence: 95,
        processingTime: "2.5 seconds",
    });
});
