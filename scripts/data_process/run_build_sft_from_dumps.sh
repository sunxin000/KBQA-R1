#!/usr/bin/env bash
set -euo pipefail

# Launcher for build_sft_from_dumps.py
# Allows you to easily run the converter with environment-variable overrides
# Defaults chosen to match repository conventions used elsewhere in this project.



# Defaults (can override via environment variables)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT=${REPO_ROOT:-"$(cd "${SCRIPT_DIR}/../.." && pwd)"}
DATASET_TYPE=${DATASET_TYPE:-webqsp}
: "${INPUT_DIR:?Set INPUT_DIR to the rejection-sampling validation/rollout dump directory}"
OUTPUT_FILE=${OUTPUT_FILE:-"${REPO_ROOT}/data/${DATASET_TYPE}_rl_dataset_sft/train_sft.parquet"}

python3 "${SCRIPT_DIR}/build_sft_from_dumps.py" \
  --dump_dir "${INPUT_DIR}" \
  --output_file "${OUTPUT_FILE}" \
  --min_mid_f1 0.9 \
  --structure_reward_eq 0.1 \
  --info_role user

