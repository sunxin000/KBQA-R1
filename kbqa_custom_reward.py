"""
Custom reward function for KBQA tasks.
This file provides a unified reward computation interface that supports multiple KBQA datasets.
"""
import logging
import os

logger = logging.getLogger(__name__)
logger.setLevel(os.getenv("VERL_LOGGING_LEVEL", "INFO"))   # Default to INFO for S-Expression logs


def compute_score(data_source, solution_str, ground_truth, extra_info=None, **kwargs):
    """
    Compute reward score for KBQA tasks based on data source.
    
    Args:
        data_source (str): Dataset identifier (e.g., 'webqsp', 'grailqa', 'nq', etc.)
        solution_str (str): Generated S-expression or answer string
        ground_truth (str): Ground truth answer
        extra_info (dict, optional): Additional information for scoring
        **kwargs: Additional keyword arguments including:
            - structure_format_score: Weight for structure format reward
            - mid_f1_weight: Weight for F1 score (mapped to correct_reward)
            - training_step: Current training step
    
    Returns:
        float or dict: Computed reward score
    """
    # Import the reward scoring modules from verl framework
    from verl.utils.reward_score import mid_reward, qa_em

    # Log received kwargs for debugging (only first few times)
    if not hasattr(compute_score, '_log_count'):
        compute_score._log_count = 0
    if compute_score._log_count < 3:
        logger.info(f"[KBQA-REWARD] Received kwargs: {kwargs}")
        compute_score._log_count += 1

    # Extract actual ground truth from the data structure
    # ground_truth comes as a dict with 'target' key for KBQA datasets
    if isinstance(ground_truth, dict) and 'target' in ground_truth:
        gt_value = ground_truth['target']
    else:
        gt_value = ground_truth
    

    # Route to appropriate scoring function based on data source
    if data_source in ['nq', 'triviaqa', 'popqa', 'hotpotqa', '2wikimultihopqa', 'musique', 'bamboogle']:
        # QA exact match scoring
        result = qa_em.compute_score_em(solution_str, gt_value)
    elif data_source in ['webqsp', 'grailqa', 'graphq']:
        # Knowledge graph mid-entity F1 scoring
        # Ensure gt_value is a list for mid_reward
        gt_list = list(gt_value) if not isinstance(gt_value, list) else gt_value
        
        # Extract relevant kwargs for compute_mid_reward
        mid_reward_kwargs = {}
        if 'structure_format_score' in kwargs:
            mid_reward_kwargs['structure_format_score'] = kwargs['structure_format_score']
        if 'mid_f1_weight' in kwargs:
            mid_reward_kwargs['correct_reward'] = kwargs['mid_f1_weight']
        if 'training_step' in kwargs:
            mid_reward_kwargs['training_step'] = kwargs['training_step']
        
        result = mid_reward.compute_mid_reward(solution_str, gt_list, **mid_reward_kwargs)
        # mid_reward returns {'total': ..., 'mid_f1': ..., 'structure_reward': ...}
        # DAPORewardManager expects either float or dict with 'score' key.
        # Preserve the full dict and add 'score' mirroring 'total' for compatibility.
        if isinstance(result, dict) and 'total' in result:
            result = dict(result)  # copy to avoid mutating original
            result['score'] = result.get('total', 0.0)
            # For graph-like datasets, return the full dict (with 'score') so downstream
            # code can access both score and components like 'mid_f1' and 'structure_reward'.
            return result
    else:
        # Default: try exact match
        result = qa_em.compute_score_em(solution_str, gt_value)
    

    # Ensure result is in the correct format (float) for non-graph datasets
    if isinstance(result, (int, float, bool)):
        return float(result)
    elif isinstance(result, dict):
        # Fallback: extract 'score' or 'total' if a dict slipped through
        return float(result.get('score', result.get('total', 0.0)))
    else:
        return float(result[0])
