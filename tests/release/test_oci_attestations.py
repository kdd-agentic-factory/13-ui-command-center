"""Bind BuildKit OCI indexes without accepting unrelated image platforms."""
import hashlib
import importlib.util
import io
import json
import tarfile
from pathlib import Path

import pytest


def fixture(path, variant):
    blobs = {}

    def blob(value):
        raw = json.dumps(value).encode()
        digest = 'sha256:' + hashlib.sha256(raw).hexdigest()
        blobs['blobs/sha256/' + digest[7:]] = raw
        return {'digest': digest, 'size': len(raw)}

    config = blob({'architecture': 'amd64', 'os': 'linux'})
    image = blob({'config': {'digest': config['digest']}, 'layers': []})
    image['platform'] = {'os': 'linux', 'architecture': 'amd64'}
    if variant == 'wrong_platform':
        image['platform']['architecture'] = 'arm64'
    attestation = blob({'config': {'digest': 'sha256:' + 'b' * 64}, 'layers': []})
    attestation['platform'] = {'os': 'unknown', 'architecture': 'unknown'}
    attestation['annotations'] = {
        'vnd.docker.reference.type': 'attestation-manifest',
        'vnd.docker.reference.digest': image['digest'] if variant != 'wrong_reference' else 'sha256:' + 'c' * 64,
    }
    children = [image, attestation]
    if variant == 'second_image':
        children.append(dict(image))
    top = blob({'mediaType': 'application/vnd.oci.image.index.v1+json', 'manifests': children})
    if variant == 'corrupt_child':
        blobs['blobs/sha256/' + image['digest'][7:]] = b'{}'
    blobs['index.json'] = json.dumps({'manifests': [top]}).encode()
    blobs['manifest.json'] = json.dumps([{'Config': 'blobs/sha256/' + config['digest'][7:]}]).encode()
    with tarfile.open(path, 'w') as stream:
        for name, raw in blobs.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(raw)
            stream.addfile(entry, io.BytesIO(raw))
    return top['digest'], config['digest']


@pytest.mark.parametrize('variant', ['valid', 'wrong_platform', 'wrong_reference', 'second_image', 'corrupt_child'])
def test_buildkit_index_is_bound_to_one_exact_linux_image(tmp_path, variant):
    spec = importlib.util.spec_from_file_location('scan_oci', Path('scripts/scan-chassis-images.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    path = tmp_path / 'image.tar'
    identity, config = fixture(path, variant)
    if variant == 'valid':
        assert module.archive_config_id(path, identity) == config
    else:
        with pytest.raises(ValueError):
            module.archive_config_id(path, identity)
