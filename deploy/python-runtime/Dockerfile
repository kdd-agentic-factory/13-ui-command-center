ARG UBUNTU_IMAGE
FROM ${UBUNTU_IMAGE}
ENV DEBIAN_FRONTEND=noninteractive PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY os-packages /opt/os-packages
RUN (cd /opt/os-packages && sha256sum --strict -c packages.sha256) && apt-get -y --no-install-recommends install /opt/os-packages/*.deb && python3.12 -m venv /opt/python
ENV PATH=/opt/python/bin:$PATH
WORKDIR /tmp
