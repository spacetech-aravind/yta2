#!/usr/bin/env python3
"""
File: debug_logger.py
Purpose: Multi-level logging system for development and production.
"""

import time
import sys
from enum import Enum

class LogLevel(Enum):
    """Logging verbosity levels"""
    SILENT = 0      # Production: Only errors
    MINIMAL = 1     # Production: Progress bars only
    NORMAL = 2      # Standard: Key milestones
    DEBUG = 3       # Development: Detailed logs
    VERBOSE = 4     # Development: Everything + timing data

class DebugLogger:
    """
    Flexible logging system with section tracking and progress bars.
    
    Usage:
        logger = DebugLogger(LogLevel.DEBUG)
        logger.section_start("Audio Generation")
        logger.log("Processing file 1/5")
        logger.data("Duration", "3.45s")
        logger.section_end("Audio Generation")
    """
    
    def __init__(self, level=LogLevel.NORMAL):
        self.level = level
        self.start_time = time.time()
        self.section_times = {}
        self.indent_level = 0
        
    def section_start(self, name):
        """Mark start of a processing section"""
        if self.level.value >= LogLevel.DEBUG.value:
            print(f"\n{'  ' * self.indent_level}{'='*60}")
            print(f"{'  ' * self.indent_level}🔧 SECTION: {name}")
            print(f"{'  ' * self.indent_level}{'='*60}")
        elif self.level == LogLevel.NORMAL:
            print(f"\n{'  ' * self.indent_level}🔧 {name}...")
            
        self.section_times[name] = time.time()
        self.indent_level += 1
        
    def section_end(self, name):
        """Mark end and show duration"""
        self.indent_level = max(0, self.indent_level - 1)
        
        if name in self.section_times:
            duration = time.time() - self.section_times[name]
            if self.level.value >= LogLevel.DEBUG.value:
                print(f"{'  ' * self.indent_level}✅ {name} completed in {duration:.2f}s")
            elif self.level == LogLevel.NORMAL:
                print(f"{'  ' * self.indent_level}✅ {name} done ({duration:.1f}s)")
                
    def log(self, message, level=LogLevel.NORMAL):
        """Conditional logging based on level"""
        if self.level.value >= level.value:
            timestamp = time.time() - self.start_time
            indent = '  ' * self.indent_level
            print(f"{indent}[{timestamp:6.2f}s] {message}")
            
    def data(self, label, value, level=LogLevel.VERBOSE):
        """Log data values (for debugging)"""
        if self.level.value >= level.value:
            indent = '  ' * self.indent_level
            print(f"{indent}   📊 {label}: {value}")
            
    def warning(self, message):
        """Always show warnings (unless SILENT)"""
        if self.level != LogLevel.SILENT:
            indent = '  ' * self.indent_level
            print(f"{indent}⚠️  WARNING: {message}")
            
    def error(self, message):
        """Always show errors"""
        indent = '  ' * self.indent_level
        print(f"{indent}❌ ERROR: {message}", file=sys.stderr)
        
    def progress(self, current, total, label="Progress"):
        """Show progress bar (always shown unless SILENT)"""
        if self.level == LogLevel.SILENT:
            return
            
        percent = (current / total) * 100
        bar_length = 40
        filled = int(bar_length * current / total)
        bar = '█' * filled + '░' * (bar_length - filled)
        
        indent = '  ' * self.indent_level
        # Carriage return to overwrite line
        sys.stdout.write(f'\r{indent}{label}: |{bar}| {percent:.1f}%')
        sys.stdout.flush()
        
        if current == total:
            print()  # Newline when complete
            
    def table_header(self, columns):
        """Print formatted table header"""
        if self.level.value >= LogLevel.DEBUG.value:
            indent = '  ' * self.indent_level
            header = " | ".join([f"{col:^15}" for col in columns])
            separator = "-" * len(header)
            print(f"\n{indent}{header}")
            print(f"{indent}{separator}")
            
    def table_row(self, values):
        """Print formatted table row"""
        if self.level.value >= LogLevel.DEBUG.value:
            indent = '  ' * self.indent_level
            row = " | ".join([f"{str(val):^15}" for val in values])
            print(f"{indent}{row}")
            
    def summary(self, title, data_dict):
        """Print a summary box"""
        if self.level.value >= LogLevel.NORMAL.value:
            indent = '  ' * self.indent_level
            print(f"\n{indent}{'─'*50}")
            print(f"{indent}📋 {title}")
            print(f"{indent}{'─'*50}")
            for key, value in data_dict.items():
                print(f"{indent}  {key}: {value}")
            print(f"{indent}{'─'*50}\n")


# Convenience function for quick logger creation
def create_logger(level_string='normal'):
    """
    Create logger from string level.
    
    Args:
        level_string: 'silent', 'minimal', 'normal', 'debug', or 'verbose'
    """
    mapping = {
        'silent': LogLevel.SILENT,
        'minimal': LogLevel.MINIMAL,
        'normal': LogLevel.NORMAL,
        'debug': LogLevel.DEBUG,
        'verbose': LogLevel.VERBOSE
    }
    return DebugLogger(mapping.get(level_string.lower(), LogLevel.NORMAL))