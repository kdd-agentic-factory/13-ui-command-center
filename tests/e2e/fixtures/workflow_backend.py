"""Real application in an empty, retained QA workspace. No production credentials/data."""
import os
from pathlib import Path
import sys
from uuid import uuid4

UI = Path(__file__).resolve().parents[3]
ROOT = UI.parent
QA = UI / '.superpowers/sdd/2026-10-26-workflow-recovery' / ('e2e-' + uuid4().hex)
QA.mkdir(parents=True)
for key, value in {
    'TDS_DATA_ROOT': str(QA / 'data'),
    'TDS_RECORDED_DIR': str(QA / 'recorded'),
    'TDS_CHASSIS_DB': str(QA / 'chassis.sqlite'),
    'TDS_DOMAIN_EVIDENCE_DB': str(QA / 'domain-evidence.sqlite'),
    'TDS_SUSPENSION_LAB_DB': str(QA / 'suspension-lab.sqlite'),
    'TDS_IDENTITY_MODE': 'local',
    'TDS_API_KEY': '',
    'TDS_APP_ENV': 'development',
    # Six independent browser contexts share one loopback IP in this QA run.
    'RATE_LIMIT_PER_MINUTE': '1000',
    'OPENBLAS_NUM_THREADS': '1',
    'OMP_NUM_THREADS': '1',
}.items():
    os.environ[key] = value
sys.path.insert(0, str(ROOT / '18-telemetry-dataset/src'))
sys.path.insert(0, str(ROOT / '17-digital-twin-simulation-lab/src'))

if __name__ == '__main__':
    import uvicorn
    from telemetry_dataset.main import create_app
    print('Workflow QA: isolated empty workspace; synthetic fixtures only', flush=True)
    uvicorn.run(create_app(), host='127.0.0.1', port=8185, log_level='warning')
