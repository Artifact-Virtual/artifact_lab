import json
from lagent.actions import IPythonInterpreter, WebBrowser, ActionExecutor
from lagent.agents.stream import get_plugin_prompt
from lagent.llms import GPTAPI
from lagent.hooks import InternLMActionProcessor

TOOL_TEMPLATE = (
    "You are a helpful AI assistant, collaborating with other assistants. Use the provided tools to progress"
    " towards answering the question. If you are unable to fully answer, that's OK, another assistant with"
    " different tools will help where you left off. Execute what you can to make progress. If you or any of"
    " the other assistants have the final answer or deliverable, prefix your response with {finish_pattern}"
    " so the team knows to stop. You have access to the following tools:\n{tool_description}\nPlease provide"
    " your thought process when you need to use a tool, followed by the call statement in this format:"
    "\n{invocation_format}\\\\n**{system_prompt}**"
)

class DataVisualizer(Agent):
    def __init__(self, model_path, research_prompt, chart_prompt, finish_pattern="Final Answer", max_turn=10):
        super().__init__()
        llm = GPTAPI(model_path, key='YOUR_OPENAI_API_KEY', retry=5, max_new_tokens=1024, stop_words=["```\n"])
        interpreter, browser = IPythonInterpreter(), WebBrowser("BingSearch", api_key="YOUR_BING_API_KEY")
        self.researcher = Agent(
            llm,
            TOOL_TEMPLATE.format(
                finish_pattern=finish_pattern,
                tool_description=get_plugin_prompt(browser),
                invocation_format='```json\n{"name": {{tool name}}, "parameters": {{keyword arguments}}}\n```\n',
                system_prompt=research_prompt,
            ),
            output_format=ToolParser(
                "browser",
                begin="```json\n",
                end="\n```\n",
                validate=lambda x: json.loads(x.rstrip('`')),
            ),
            aggregator=InternLMToolAggregator(),
            name="researcher",
        )
        self.charter = Agent(
            llm,
            TOOL_TEMPLATE.format(
                finish_pattern=finish_pattern,
                tool_description=interpreter.name,
                invocation_format='```python\n{{code}}\n```\n',
                system_prompt=chart_prompt,
            ),
            output_format=ToolParser(
                "interpreter",
                begin="```python\n",
                end="\n```\n",
                validate=lambda x: x.rstrip('`'),
            ),
            aggregator=InternLMToolAggregator(),
            name="charter",
        )
        self.executor = ActionExecutor([interpreter, browser], hooks=[InternLMActionProcessor()])
        self.finish_pattern = finish_pattern
        self.max_turn = max_turn

    def forward(self, message, session_id=0):
        for _ in range(self.max_turn):
            message = self.researcher(message, session_id=session_id, stop_words=["```\n", "```python"]) # override llm stop words
            while message.formatted["tool_type"]:
                message = self.executor(message, session_id=session_id)
                message = self.researcher(message, session_id=session_id, stop_words=["```\n", "```python"])
            if self.finish_pattern in message.content:
                return message
            message = self.charter(message)
            while message.formatted["tool_type"]:
                message = self.executor(message, session_id=session_id)
                message = self.charter(message, session_id=session_id)
            if self.finish_pattern in message.content:
                return message
        return message

visualizer = DataVisualizer(
    "gpt-4o-2024-05-13",
    research_prompt="You should provide accurate data for the chart generator to use.",
    chart_prompt="Any charts you display will be visible by the user.",
)
user_msg = AgentMessage(
    sender='user',
    content="Fetch the China's GDP over the past 5 years, then draw a line graph of it. Once you code it up, finish.")
bot_msg = visualizer(user_msg)
print(bot_msg.content)
json.dump(visualizer.state_dict(), open('visualizer.json', 'w'), ensure_ascii=False, indent=4)