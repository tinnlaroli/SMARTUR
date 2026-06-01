#!/usr/bin/env python3
"""Quick test to verify meta_learner imports correctly."""
import sys
print(f"Python version: {sys.version}")
try:
    from meta_learner import MetaBlender
    print("✓ meta_learner imports successfully")
except Exception as e:
    print(f"✗ meta_learner import failed: {e}")
    sys.exit(1)
