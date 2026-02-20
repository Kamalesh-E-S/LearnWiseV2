import os
import streamlit as st
from groq import Groq

class GroqLLMGenerator:
    def __init__(self, api_key=None):
        """
        Initialize Groq client
        """
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        
        if not self.api_key:
            raise ValueError("Groq API key is required. Set via parameter or GROQ_API_KEY environment variable.")
        
        self.client = Groq(api_key=self.api_key)

    def generate_markmap_learning_path(self, skill, base_knowledge, timeframe, learning_level):
        """
        Generate a learning path in Markmap format
        """
  
        prompt = f"""
I need a personalized roadmap for learning {skill} within {timeframe}. 
My current knowledge level is {base_knowledge}, and I'd like to reach a {learning_level} level of proficiency.

Please structure the roadmap into two distinct parts separated by "---":

Part 1: Create a hierarchical learning path with:
- hashes [varname] nodename
- Single hash (#) for {skill}
- Double hash (##) for time periods (day/week/month divisions)
- Triple hash (###) for specific learning topics
- Quadruple hash (####) for optional subtopics where needed

Part 2: For each node in the roadmap, provide:
- varname,(description of nodename,youtube links: ,website links: ) 
- The variable name matching the node from Part 1
- A detailed description of the topic/concept
- Relevant YouTube tutorial links
- Helpful website resources or documentation

EXAMPLE --FOLLOW THIS FORMAT STRICTLY MAXIMUM DOUBLE HASH MUST BE 6 AND TRY AVOIDING QUADRUPLE HASHES LESS -MAXIMUM 4:

# [root] js
## [a1] Week 1
### [a11] JavaScript Refresher  
#### [a111] Variables and Data Types
---
root, (description of nodename,youtube links: ,website links: ) 
a1, (description of a1,youtube links: ,website links: ) 
a11, (description of a11,youtube links: ,website links: ) 
a111, (description of a111,youtube links: ,website links: ) 

NOTE: 
1.total number of quadruple hashes should be 4 or less. use it when the subtopic is actually required.
2.total number of double hashes should be 6 or less.
3.keep the node names short and concise.
4.the markmap like code should given first and triple hypen then description section should be there.
4.Please ensure the roadmap is comprehensive yet realistic and simple for my {timeframe} and builds logically from my current knowledge level to my desired proficiency.
5.Do not include any introductory text, explanatory notes, headers, or concluding remarks in your response.
"""


        try:
            # Use Llama 3 70b as the default model
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert learning path designer. Generate the output EXACTLY in the specified Markmap format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama3-70b-8192"  # Groq's Llama 3 70B model
            )
            
            return chat_completion.choices[0].message.content
        
        except Exception as e:
            raise RuntimeError(f"Groq API Error: {e}")
   
def main():
    st.set_page_config(page_title="Markmap Learning Path Generator", page_icon="🚀")
    st.title("🚀 Markmap Learning Path Generator")
    
    # API Key Input
    api_key = st.text_input("Enter Groq API Key", type="password")
    
    # Skill Input
    col1, col2 = st.columns(2)
    
    with col1:
        skill = st.text_input("🎯 Skill to Learn", placeholder="e.g., Python Programming")
        base_knowledge = st.text_input("🧠 Current Knowledge", placeholder="e.g., Basic coding experience")
    
    with col2:
        timeframe = st.text_input("⏰ Learning Timeframe", placeholder="e.g., 3 months")
        learning_level = st.selectbox("📊 Target Proficiency", [
            "Beginner", "Intermediate", "Advanced", "Expert", "Mastery"
        ])
    
    # Generate Button
    if st.button("🔍 Generate Markmap Learning Path", type="primary"):
        if api_key and skill and base_knowledge:
            try:
                # Initialize Groq LLM Generator
                llm_generator = GroqLLMGenerator(api_key=api_key)
                
                # Generate Learning Path
                with st.spinner("Crafting your Markmap learning journey..."):
                    learning_path = llm_generator.generate_markmap_learning_path(
                        skill, base_knowledge, timeframe, learning_level
                    )
                
                # Display Learning Path
                st.code(learning_path, language="markdown")
                
                # Optional: Add copy to clipboard button
                st.download_button(
                    label="📋 Copy Markmap Learning Path",
                    data=learning_path,
                    file_name=f"{skill.lower().replace(' ', '_')}_markmap_learning_path.txt",
                    mime="text/plain"
                )
            
            except Exception as e:
                st.error(f"Error generating learning path: {e}")
        else:
            st.warning("Please fill in all fields")

if __name__ == "__main__":
    main()
"""groq
your_groq_api_key_here
"""