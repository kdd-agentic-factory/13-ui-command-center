FROM mcr.microsoft.com/playwright:v1.61.1-noble@sha256:5b8f294aff9041b7191c34a4bab3ac270157a28774d4b0660e9743297b697e48
USER root
COPY *.deb packages.sha256 /opt/qa-packages/
RUN cd /opt/qa-packages && sha256sum --strict -c packages.sha256 && apt-get install -y --no-install-recommends /opt/qa-packages/*.deb && rm -rf /opt/qa-packages
ENV HOME=/tmp NODE_PATH=/deps
USER 1000:1000
