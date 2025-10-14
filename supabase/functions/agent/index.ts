
import { serve } from "http";
import { Agent, run, fileSearchTool } from "openai-agent";
import { z } from "zod";
import { zodResponseFormat } from "zod-helper";


const ProfileType = z.object({
  name: z.string(),
  skills: z.array(z.string())
});

const OutputType = z.object({
  profiles: z.array(ProfileType)
})
const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful Assistant. You have access to a file search tool that can search within a vector database of profiles to find relevant information based on user queries. Use this tool to retrieve profiles that match the user\'s request.',
  outputType: OutputType,
  model: 'gpt-4.1-mini',
  tools:[fileSearchTool("vs_68eccba7c77c8191bc86d3e6ac956401")]
});


serve(async (req)=>{
  const { prompt } = await req.json();
  const result = await run(agent, prompt);
  return new Response(JSON.stringify(result.finalOutput))
});
