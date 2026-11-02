"""Bounded, explicitly registered QA run with local-only model; no human authority."""
import asyncio
import json
import subprocess
import sys
import time
import urllib.request

from model_readiness import run_when_model_ready
from telemetry_dataset.persistence.bootstrap import load_cloud_app
from telemetry_dataset.persistence.worker_runtime import run_registered_once

report = {'status': 'blocked', 'scope': 'current_image_real_local_model_worker',
          'candidate_acceptance': False, 'human_approval': False, 'deployment': False,
          'model_transport': [], 'passes': []}


def progress(body):
    print(json.dumps(body), file=sys.stderr, flush=True)


def request_json(method, path, payload, timeout):
    request = urllib.request.Request('http://127.0.0.1:11434' + path, data=None if payload is None else json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method=method)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read(65537)
    if len(raw) > 65536:
        raise ValueError('Bounded model response required')
    return json.loads(raw)


async def main():
    app = load_cloud_app('/run/cloud/descriptor')
    async with app.router.lifespan_context(app):
        provider = app.state.cloud_private_dispatcher._workers['qa-current-image-worker'].control._provider
        original = provider._request

        def observed(payload, timeout):
            row = {'timeout_seconds': round(timeout, 3), 'num_threads': payload.get('options', {}).get('num_thread'), 'prompt_chars': len(payload.get('prompt', ''))}
            report['model_transport'].append(row)
            progress({'model_call': len(report['model_transport']), 'stage': 'started'})
            started = time.monotonic()
            try:
                raw = original(payload, timeout)
                data = json.loads(raw)
                row['server_metrics'] = {k: data[k] for k in ('total_duration', 'load_duration', 'prompt_eval_count', 'prompt_eval_duration', 'eval_count', 'eval_duration') if type(data.get(k)) is int}
                return raw
            except Exception as error:
                row['error_type'] = type(error).__name__
                raise
            finally:
                row['elapsed_seconds'] = round(time.monotonic() - started, 3)
                progress({'model_call': len(report['model_transport']), 'stage': 'finished', 'elapsed_seconds': row['elapsed_seconds']})

        provider._request = observed

        async def work():
            for index in range(11):
                started = time.monotonic()
                worked = await run_registered_once(app, 'qa-current-image-worker', admit=index == 0)
                row = {'index': index, 'worked': bool(worked), 'elapsed_seconds': round(time.monotonic() - started, 3)}
                report['passes'].append(row)
                progress({'worker_pass': index, 'worked': bool(worked)})
                if not worked:
                    break
            return bool(report['passes'])

        report['worked'] = await run_when_model_ready({'name': 'qwen3:1.7b', 'digest': '8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7', 'url': 'http://127.0.0.1:11434', 'num_threads': 6}, request_json, work, budget_seconds=60)
        report['status'] = 'passed'


if __name__ == '__main__':
    process = subprocess.Popen(['/opt/ollama/bin/ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(30):
            try:
                request_json('GET', '/api/tags', None, 2)
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError('Local model unavailable')
        asyncio.run(main())
    except Exception as error:
        report['error_type'] = type(error).__name__
        if hasattr(error, 'status_code'):
            report['http_status'] = error.status_code
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
    print(json.dumps(report))
