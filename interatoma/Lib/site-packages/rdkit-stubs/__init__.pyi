from __future__ import annotations
import logging as logging
import sys as sys
from .rdBase import *
__all__ = ['log_handler', 'logger', 'logging', 'rdBase', 'sys']
__version__: str = '2024.03.5'
log_handler: logging.StreamHandler  # value = <StreamHandler <stderr> (NOTSET)>
logger: logging.Logger  # value = <Logger rdkit (WARNING)>
