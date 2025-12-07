#!/usr/bin/env python3
"""
File: usp_content_variations.py
Purpose: USP-driven content variations for NCERT QuickPrep brand.
All text elements that reinforce: Speed, Efficiency, Child-Friendly, Trendy
"""

import random

# =============================================================================
# BRAND USPs:
# 1. Speed & Efficiency: "7-minute mastery, not sleep-inducing lectures"
# 2. Child-Friendly & Trendy: "Affectionate, Gen-Z native, playful"
# =============================================================================


class USPContent:
    """Central repository for all brand-aligned text variations"""
    
    # -------------------------------------------------------------------------
    # HOOK VARIATIONS (Opening attention grabber)
    # -------------------------------------------------------------------------
    HOOKS = [
        "⚡ 7-MINUTE CHAPTER MASTERY ⚡",
        "🚀 FASTEST REVISION EVER 🚀",
        "⏱️ EXAM READY IN 60 SECONDS ⏱️",
        "💯 QUICK CONCEPTS, BIG SCORES 💯",
        "🔥 NO BORING LECTURES HERE 🔥",
        "⚡ SPEED LEARNING MODE ON ⚡",
        "🎯 RAPID FIRE REVISION 🎯",
        "✨ SHORT, SWEET, SMART ✨",
        "💥 FAST TRACK TO SUCCESS 💥",
        "🚀 ZERO SLEEP, FULL PREP 🚀"
    ]
    
    # -------------------------------------------------------------------------
    # QUESTION PREFIXES (Affectionate addressing)
    # -------------------------------------------------------------------------
    QUESTION_PREFIXES = [
        "Quick Brainiacs! ",      # Affectionate + Smart
        "Speed Stars! ",          # Trendy + Fast
        "Exam Warriors! ",        # Empowering + Target
        "Fast Learners! ",        # USP-aligned
        "Quick Champs! ",         # Affectionate + Achievement
        "Revision Ninjas! ",      # Playful + Speed
        "Future Toppers! ",       # Aspirational + Friendly
        "Smart Cookies! ",        # Playful + Affectionate
        "Knowledge Seekers! ",    # Respectful + Empowering
        "Bright Minds! "          # Positive + Encouraging
    ]
    
    # -------------------------------------------------------------------------
    # TIMER LABELS (Speed emphasis during countdown)
    # -------------------------------------------------------------------------
    TIMER_LABELS = [
        "⚡ THINK FAST",
        "🚀 QUICK THINKING",
        "⏱️ SPEED MODE",
        "💨 RAPID FIRE",
        "⚡ LIGHTNING ROUND",
        "🎯 FAST BRAIN",
        "💥 QUICK RECALL"
    ]
    
    # -------------------------------------------------------------------------
    # ANSWER REVEAL PREFIXES (Celebration + Learning)
    # -------------------------------------------------------------------------
    ANSWER_PREFIXES = [
        "💯 NAILED IT! ",
        "🎯 PERFECT! ",
        "⚡ SUPER QUICK! ",
        "✨ GENIUS MOVE! ",
        "🚀 SPOT ON! ",
        "💥 BOOM! CORRECT! ",
        "🌟 BRILLIANT! ",
        "🔥 ON FIRE! ",
        "⚡ LIGHTNING FAST! "
    ]
    
    # -------------------------------------------------------------------------
    # CTA VARIATIONS (Call-to-Action with USP reinforcement)
    # -------------------------------------------------------------------------
    CTA_SOCIAL = [
        "🔔 SUBSCRIBE FOR 7-MIN CHAPTERS",
        "💯 JOIN THE FAST LEARNERS CLUB",
        "⚡ SUBSCRIBE FOR QUICK CONCEPTS",
        "🚀 HIT SUBSCRIBE FOR SPEED REVISION",
        "✨ SUBSCRIBE FOR ZERO BORING STUFF",
        "🎯 SUBSCRIBE FOR RAPID MASTERY",
        "⏱️ SUBSCRIBE FOR QUICK PREP"
    ]
    
    CTA_LINKS = [
        "📎 Full 7-Min Chapter Below",
        "🎯 Complete Fast Revision in Link",
        "⚡ Quick Full Chapter in Description",
        "🚀 Rapid Full Video in Link",
        "💯 Fast Complete Revision Below",
        "⏱️ Speed Through Full Chapter Below",
        "🔥 No-Boring Full Video in Link"
    ]
    
    # -------------------------------------------------------------------------
    # OUTRO VARIATIONS (Brand promise reinforcement)
    # Format: (Line 1, Line 2)
    # -------------------------------------------------------------------------
    OUTRO_MESSAGES = [
        ("🚀 7-MINUTE CHAPTERS", "📚 Every Concept, Zero Boredom"),
        ("⚡ FASTEST REVISIONS", "🎯 Subscribe for Quick Mastery"),
        ("💯 EXAM READY FAST", "⏱️ Full Chapters in 7 Minutes"),
        ("✨ NO BORING LECTURES", "🔥 Subscribe for Speed Learning"),
        ("🎯 QUICK CONCEPTS", "💪 Big Scores, Short Videos"),
        ("⚡ SPEED LEARNING", "🚀 Fast, Fun, Effective"),
        ("💥 RAPID MASTERY", "📖 Subscribe for Quick Prep")
    ]
    
    # -------------------------------------------------------------------------
    # HELPER METHODS
    # -------------------------------------------------------------------------
    
    @staticmethod
    def get_random_hook():
        """Returns random hook text"""
        return random.choice(USPContent.HOOKS)
    
    @staticmethod
    def get_random_question_prefix():
        """Returns random affectionate prefix for questions"""
        return random.choice(USPContent.QUESTION_PREFIXES)
    
    @staticmethod
    def get_random_timer_label():
        """Returns random timer label"""
        return random.choice(USPContent.TIMER_LABELS)
    
    @staticmethod
    def get_random_answer_prefix():
        """Returns random celebration prefix"""
        return random.choice(USPContent.ANSWER_PREFIXES)
    
    @staticmethod
    def get_random_cta():
        """Returns tuple of (social_action, link_directive)"""
        return (
            random.choice(USPContent.CTA_SOCIAL),
            random.choice(USPContent.CTA_LINKS)
        )
    
    @staticmethod
    def get_random_outro():
        """Returns tuple of (line1, line2)"""
        return random.choice(USPContent.OUTRO_MESSAGES)
    
    @staticmethod
    def enhance_question(question_text):
        """Adds affectionate prefix to question"""
        prefix = USPContent.get_random_question_prefix()
        return prefix + question_text
    
    @staticmethod
    def enhance_answer(correct_opt, answer_text):
        """Adds celebration prefix to answer"""
        prefix = USPContent.get_random_answer_prefix()
        return prefix + f"{correct_opt}: {answer_text}"


# =============================================================================
# USAGE EXAMPLES (for reference)
# =============================================================================

if __name__ == "__main__":
    print("=== USP CONTENT VARIATIONS DEMO ===\n")
    
    print("HOOKS (5 samples):")
    for _ in range(5):
        print(f"  - {USPContent.get_random_hook()}")
    
    print("\nQUESTION ENHANCEMENT:")
    original = "What is the formula for water?"
    enhanced = USPContent.enhance_question(original)
    print(f"  Original: {original}")
    print(f"  Enhanced: {enhanced}")
    
    print("\nTIMER LABELS (3 samples):")
    for _ in range(3):
        print(f"  - {USPContent.get_random_timer_label()}")
    
    print("\nANSWER ENHANCEMENT:")
    answer_enhanced = USPContent.enhance_answer("A", "H₂O")
    print(f"  Enhanced: {answer_enhanced}")
    
    print("\nCTA PAIR:")
    social, link = USPContent.get_random_cta()
    print(f"  Social: {social}")
    print(f"  Link: {link}")
    
    print("\nOUTRO PAIR:")
    line1, line2 = USPContent.get_random_outro()
    print(f"  Line 1: {line1}")
    print(f"  Line 2: {line2}")