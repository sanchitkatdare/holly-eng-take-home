"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { findRelevantJobData } from "@/lib/data";
import { ChatMessage } from "@/types";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function chatAction(history: ChatMessage[], message: string): Promise<ChatMessage> {
  const context = await findRelevantJobData(message);

  let systemPrompt = "You are an HR assistant. Answer questions based ONLY on the provided context. If context is missing, be helpful but explain what you couldn't find.";

  if (context) {
    const { job, salary, matchedJurisdiction } = context;
    systemPrompt += `\n\nRelevant Context:\nJob Title: ${job.title}\nJurisdiction: ${matchedJurisdiction}\nJob Code: ${job.code}\nDescription: ${job.description}`;

    if (salary) {
      systemPrompt += `\nSalary Info for ${matchedJurisdiction}: ${JSON.stringify(salary)}`;
    } else {
      systemPrompt += `\nNote: No salary information was found for this job code (${job.code}) in ${matchedJurisdiction}.`;
    }
  } else {
    systemPrompt += "\n\nNo specific job record was found for this query. Ask the user for more details like job title and county.";
  }

  // Call Gemini
  try {
    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(
      `${systemPrompt}\n\nUser Question: ${message}`
    );
    const response = await result.response;
    const text = response.text();

    return {
      role: "assistant",
      content: text,
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      role: "assistant",
      content: "I'm sorry, I encountered an error processing your request.",
    };
  }
}
