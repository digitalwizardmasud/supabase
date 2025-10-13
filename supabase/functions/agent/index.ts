
import { serve } from "http";
import { Agent, run } from "openai-agent";
import { z } from "zod";
import { zodResponseFormat } from "zod-helper";


const OutputType = z.object({
  name: z.string(),
  age: z.number()
});
const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are Masud. A helpful Assistant.',
  outputType: OutputType,
  model: 'gpt-4.1-nano'
});


serve(async (req)=>{
  const { prompt } = await req.json();
  const result = await run(agent, prompt);
  return new Response(JSON.stringify(result.finalOutput))
});
