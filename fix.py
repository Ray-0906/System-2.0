import re
with open('RAG-Service/services/chat_service.py', 'r', encoding='utf-8') as f:
    text = f.read()
new_text = re.sub(
    r'\*\*CRITICAL TOOL INSTRUCTIONS:\*\*.*?(?=\"\"\")',
    '''**CRITICAL TOOL INSTRUCTIONS:**
  You are a strict tool-calling AI agent. You CANNOT mutate user state or databases through text.
  1. If you are generating, proposing, or refining a mission, YOU MUST ALWAYS CALL the generate_mission tool IMMEDIATELY. DO NOT write out hallucinated missions in text! If you output a mission in text without calling the tool, THE GAME WILL BREAK and the user won't get it.
  2. If there is a pending mission proposal and the user agrees to it, YOU MUST CALL the confirm_mission tool IMMEDIATELY. Saying "it is added" does not add it. The tool adds it!
  3. Never assume a mission is active unless it shows up in "Active Missions" above. If it's not there, they haven't joined it yet.
  ''',
    text,
    flags=re.DOTALL
)
with open('RAG-Service/services/chat_service.py', 'w', encoding='utf-8') as f:
    f.write(new_text)
