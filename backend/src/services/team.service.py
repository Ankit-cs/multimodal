# Assembles the Planner, Researcher, Executor, etc.
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from src.services.config import settings
# Added new calendar, time, and email tools from friend's code
from src.utils.tools import duckduckgo_tool, calendar_tool, current_time_tool, email_tool, GlobalEventParams
import datetime

def build_orchestrai_team(is_approved: bool = False, extra_tools: list = None, hitl_enabled: bool = True, owner_email: str = None):
    # model_info is required for non-OpenAI model names
    from autogen_core.models import ModelInfo

    # Added time-awareness from friend's code
    current_date = datetime.datetime.now().strftime("%A, %B %d, %Y")

    if extra_tools is None:
        extra_tools = []
        
    def make_client(api_key: str, model_name: str, base_url: str = settings.GROQ_BASE_URL) -> OpenAIChatCompletionClient:
        return OpenAIChatCompletionClient(
            model=model_name,
            api_key=api_key,
            base_url=base_url,
            model_info=ModelInfo(
                vision=False,
                function_calling=True,
                json_output=True,
                family="unknown",
                structured_output=False,
            ),
        )

    # Fugu Orchestration: Using Gemini as the Manager LLM and specialized agents
    manager_client    = make_client(settings.GEMINI_API_KEY_PLANNER, settings.GEMINI_MODEL, settings.GEMINI_BASE_URL)
    planner_client    = make_client(settings.GEMINI_API_KEY_PLANNER, settings.GEMINI_MODEL, settings.GEMINI_BASE_URL)
    reviewer_client   = make_client(settings.GEMINI_API_KEY_REVIEWER, settings.GEMINI_MODEL, settings.GEMINI_BASE_URL)
    researcher_client = make_client(settings.GEMINI_API_KEY_RESEARCHER, settings.GEMINI_MODEL, settings.GEMINI_BASE_URL)
    executor_client   = make_client(settings.GEMINI_API_KEY_EXECUTOR, settings.GEMINI_MODEL, settings.GEMINI_BASE_URL)
    finalizer_client  = make_client(settings.GEMINI_API_KEY_REVIEWER, settings.GEMINI_MODEL, settings.GEMINI_BASE_URL)

    # -- Dynamic Tools Bound to User Context --
    import uuid
    from src.db.database import db_service
    from autogen_core.tools import FunctionTool
    
    async def custom_add_global_event(params: GlobalEventParams) -> str:
        """Saves an event/reminder to the Calendar. Visible to this user."""
        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        event_data = {
            "id": event_id,
            "title": params.title,
            "start_time": params.start_time,
            "end_time": params.end_time,
            "description": params.description,
            "type": params.type
        }
        if owner_email:
            event_data["owner_email"] = owner_email
            
        try:
            await db_service.save_calendar_event(event_data)
            return f"SUCCESS: Global {params.type.lower()} scheduled: '{params.title}' at {params.start_time}. ID: {event_id}"
        except Exception as e:
            return f"ERROR: Failed to save to global calendar: {str(e)}"

    global_calendar_tool = FunctionTool(custom_add_global_event, description="Adds an event or reminder to the shared Global Calendar and Timeline.")

    # -- Define Agents --
    planner = AssistantAgent(
        name="Planner",
        model_client=planner_client,
        tools=[current_time_tool], # Friend's addition
        description="Plans the workflow. Route to this agent first, or when the user provides new Feedback.",
        # Injected current date into system message
        system_message=f"You are the Architect. Today is {current_date}. Decompose the user's objective into a step-by-step plan. Assign steps to Researcher or Executor. Do NOT execute tools yourself."
    )

    researcher = AssistantAgent(
        name="Researcher",
        model_client=researcher_client,
        tools=[duckduckgo_tool, current_time_tool] + extra_tools, # Friend's addition
        description="Gathers facts. Route here when the Planner asks for research.",
        system_message="""You are the Context Gatherer. Use search tools to find facts. Return clear data for the Executor to use.
        If you have Finance tools (like stock_news or stock_info), use them for stock-specific news or financial data.
        NOTE: If search returns no results, try broader or different keywords before giving up."""
    )

    executor = AssistantAgent(
        name="Executor",
        model_client=executor_client,
        # Merged new global calendar, time, and email tools
        tools=[calendar_tool, global_calendar_tool, current_time_tool, email_tool] + extra_tools,
        description="Executes APIs. Route here when the Planner asks for an action to be performed.",
        system_message=f"""You are the Executor. Today is {current_date}.
        You execute APIs based on the Planner's instructions and Researcher's data.
        PROACTIVE ACTION: If scheduling for a relative date like 'next Thursday', resolve it using today's date ({current_date}).
        Do not ask the user for information you can infer from the current date or search results."""
    )

    hitl_instruction = "IMPORTANT: For EVERY task, once the Executor has produced the desired result, you MUST output exactly 'STATUS: PENDING_APPROVAL' to ask for human approval. You must do this for every request before proceeding." if hitl_enabled else "NOTE: Human-In-The-Loop approval is DISABLED."

    reviewer = AssistantAgent(
        name="Reviewer",
        model_client=reviewer_client,
        description="Quality control. Route here only when the Executor has finished its task.",
        system_message=f"""You are Quality Control. Review the Executor's output.
        1. {hitl_instruction}
        2. VERIFY EXECUTION: Only approve if you see a SUCCESS message from a tool execution (like add_global_event). If the Executor just 'plans' to do it or 'asks' for info, DO NOT APPROVE. Provide feedback to the Executor instead.
        3. If the human has explicitly approved the work (message contains "Human Approved"), you may pass it to the finalizer: 'Quality Control: approved. Finalizer, please output the final summary.'
        4. If the human provides feedback (message contains "User Feedback"), instruct the team to address the feedback.
        5. If there are errors, provide feedback to the Executor."""
    )

    finalizer = AssistantAgent(
        name="Finalizer",
        model_client=finalizer_client,
        description="Formats final output. Route here ONLY when the Reviewer has fully approved the work and tasks are complete.",
        system_message="""You are the Presenter. Convert technical results into a premium, beautiful summary.
        1. FACTUAL HONESTY: Only claim an event is 'saved' if the Executor successfully ran the tool. If the workflow failed or asked a question, reflect that honestly.
        2. STRUCTURED LAYOUT: Use '## SECTION NAME' for major categories. Use bold labels (e.g., **Key:** Value) for specific data points.
        3. AVOID TABLES: Do NOT use markdown tables. Instead, use clean bullet points and indented lists for readability.
        4. FONT & TONE: Use a classy, professional, and helpful tone.
        5. End your message with exactly: COMPLETE_WORKFLOW""" 
    )

    # -- Terminations --
    fallback_termination = MaxMessageTermination(max_messages=30)
    done_termination = TextMentionTermination("COMPLETE_WORKFLOW")

    if hitl_enabled and not is_approved:
        hitl_termination = TextMentionTermination("STATUS: PENDING_APPROVAL")
        termination_condition = hitl_termination | done_termination | fallback_termination
    else:
        termination_condition = done_termination | fallback_termination

    # -- Create Team --
    team = SelectorGroupChat(
        participants=[planner, researcher, executor, reviewer, finalizer],
        model_client=manager_client,
        termination_condition=termination_condition
    )
    
    return team
