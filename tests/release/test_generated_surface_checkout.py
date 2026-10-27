"""The generated nginx perimeter must survive Windows Git checkout unchanged."""
import subprocess
from pathlib import Path


def test_windows_checkout_preserves_generated_perimeter_bytes(tmp_path):
    root = Path(__file__).resolve().parents[2]
    repo = tmp_path / 'checkout'
    repo.mkdir()
    subprocess.run(['git', 'init', '--quiet', str(repo)], check=True)
    subprocess.run(['git', '-C', str(repo), 'config', 'core.autocrlf', 'true'], check=True)
    (repo / '.gitattributes').write_bytes((root / '.gitattributes').read_bytes())
    relative = 'deploy/chassis-surface.map.conf'
    output = repo / relative
    output.parent.mkdir()
    original = (root / relative).read_bytes().replace(b'\r\n', b'\n')
    output.write_bytes(original)
    subprocess.run(['git', '-C', str(repo), 'add', '.gitattributes', relative],
                   check=True, capture_output=True)
    output.unlink()
    subprocess.run(['git', '-C', str(repo), 'checkout-index', '--force', relative],
                   check=True, capture_output=True)
    assert output.read_bytes() == original
