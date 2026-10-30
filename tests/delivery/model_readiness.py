"""Explicit local model preload gate. Does not admit runs or accept session data."""
import math
import time
from prepare_real_acceptance import MODEL_DIGESTS, exact


def preload_model(model, request_json, *, budget_seconds=60, clock=time.monotonic):
    """A trusted launcher supplies bounded loopback-only JSON transport.

    The model server must also set OLLAMA_KEEP_ALIVE=-1, otherwise subsequent
    normal requests can replace the preload request's keep_alive duration.
    """
    try:
        exact(model, {'name', 'digest', 'url'})
        if (not isinstance(model['name'], str) or model['name'] not in MODEL_DIGESTS
                or model['digest'] != MODEL_DIGESTS[model['name']]
                or model['url'] != 'http://127.0.0.1:11434'
                or type(budget_seconds) not in (int, float)
                or not math.isfinite(budget_seconds) or not 0 < budget_seconds <= 60):
            raise ValueError('Explicit reviewed local model and deadline required')
        started = clock()
        deadline = started + budget_seconds

        def remaining():
            value = deadline - clock()
            if not value > 0:
                raise TimeoutError()
            return value

        def call(method, path, payload=None):
            result = request_json(method, path, payload, remaining())
            remaining()
            if not isinstance(result, dict):
                raise ValueError('Model object required')
            return result

        def exact_model(body):
            rows = body.get('models')
            if not isinstance(rows, list) or len(rows) > 64:
                raise ValueError('Bounded model list required')
            selected = [r for r in rows if isinstance(r, dict) and r.get('name') == model['name']]
            if len(selected) != 1 or selected[0].get('digest') != model['digest']:
                raise ValueError('Exact model digest unavailable')

        exact_model(call('GET', '/api/tags'))
        loaded = call('POST', '/api/generate', {'model': model['name'], 'stream': False, 'keep_alive': -1})
        if (loaded.get('model') != model['name'] or loaded.get('done') is not True
                or loaded.get('response', '') != '' or loaded.get('thinking', '') != ''):
            raise ValueError('Empty model preload required')
        exact_model(call('GET', '/api/ps'))
        exact_model(call('GET', '/api/tags'))
        return {'scope': 'local_model_readiness_preflight', 'loaded': True,
                'model_digest_verified': True, 'prompt_supplied': False,
                'elapsed_s': round(clock() - started, 3),
                'admission_authorized': False, 'candidate_acceptance': False}
    except TimeoutError:
        raise TimeoutError('Local model readiness deadline exceeded') from None
    except Exception:
        raise ValueError('Local model readiness rejected') from None

async def run_when_model_ready(model, request_json, worker_pass, *, budget_seconds=60):
    """Operator launcher guard; worker_pass retains every authorization check.

    A prepared model never grants admission. The trusted async callback must use
    the normal dispatcher/worker path, not mutate run state directly. No worker
    callback is invoked until readiness succeeds; its exceptions/result survive.
    """
    import asyncio
    readiness = await asyncio.to_thread(
        preload_model, model, request_json, budget_seconds=budget_seconds,
    )
    worker_result = await worker_pass()
    return {'readiness': readiness, 'worker_result': worker_result}
