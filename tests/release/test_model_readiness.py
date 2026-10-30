"""Readiness must not authorize a run or receive session/prompt contents."""
import importlib.util
from pathlib import Path
import sys
import pytest


def module():
    sys.path.insert(0,str(Path('tests/delivery').resolve()))
    s=importlib.util.spec_from_file_location('readiness','tests/delivery/model_readiness.py')
    m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m


def model():
    return {'name':'qwen3:1.7b','digest':'8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7','url':'http://127.0.0.1:11434'}


def test_preload_has_no_prompt_and_requires_resident_exact_model():
    m=module();calls=[]
    def request(method,path,payload,timeout):
        calls.append((method,path,payload,timeout))
        if path=='/api/generate':
            assert payload=={'model':'qwen3:1.7b','stream':False,'keep_alive':-1}
            return {'model':'qwen3:1.7b','done':True,'response':''}
        return {'models':[{'name':model()['name'],'digest':model()['digest']}]}
    report=m.preload_model(model(),request)
    assert any(c[1]=='/api/ps' for c in calls)
    assert report['loaded'] and not report['admission_authorized'] and not report['candidate_acceptance']
    assert all(0<c[3]<=60 for c in calls)


@pytest.mark.parametrize('kind',['digest','missing','not_done','generated_text','not_resident','switched_tag','remote','nan'])
def test_readiness_rejects_invalid_or_unloaded_model(kind):
    m=module();selected=model();calls=[]
    if kind=='remote':selected['url']='https://other.invalid'
    def request(method,path,payload,timeout):
        calls.append(path)
        if path=='/api/generate':return {'model':selected['name'],'done':kind!='not_done','response':'invented text' if kind=='generated_text' else ''}
        rows=[{'name':selected['name'],'digest':selected['digest']}]
        if kind=='digest' or kind=='switched_tag' and calls.count('/api/tags')>1:rows[0]['digest']='f'*64
        if kind=='missing' or kind=='not_resident' and path=='/api/ps':rows=[]
        return {'models':rows}
    with pytest.raises(ValueError):m.preload_model(selected,request,budget_seconds=float('nan') if kind=='nan' else 60)
    if kind in ['digest','missing','remote','nan']:assert '/api/generate' not in calls


def test_exhausted_readiness_budget_does_not_load_or_admit():
    m=module();now=[0.0];calls=[]
    def request(method,path,payload,timeout):
        calls.append(path);now[0]=61
        return {'models':[{'name':model()['name'],'digest':model()['digest']}]}
    with pytest.raises(TimeoutError):m.preload_model(model(),request,clock=lambda:now[0])
    assert calls==['/api/tags']
