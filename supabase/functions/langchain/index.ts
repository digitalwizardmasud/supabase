
import { serve } from "http";
import { Agent, run } from "openai-agent";
import { z } from "zod";
import { zodResponseFormat } from "zod-helper";
import { ChatOpenAI } from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";



const model = new ChatOpenAI({
  model: "gpt-4.1-nano",
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant."],
  ["human", "{user_input}"],
]);

const chain = prompt.pipe(model);

serve(async (req)=>{
  
  const { prompt } = await req.json();
  const user_input = prompt;
  const result = await chain.invoke({ user_input });

  return new Response(JSON.stringify({ result:result.content }))
});
