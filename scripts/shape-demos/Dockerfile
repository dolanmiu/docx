# The environment the shape demos are drawn in for the visual regression tests.
#
# LibreOffice and fonts change how pages are drawn, so everything is pinned: the base image by its digest, Debian's
# packages to the snapshot of the archive the base image was made from, and LibreOffice to a release from The
# Document Foundation's archive. The reference images in ./references are drawn in this image, on linux/amd64, so
# renders from CI and from a Mac or Windows machine match.
#
# Build: docker build --platform linux/amd64 -t docx-shape-renderer scripts/shape-demos

FROM debian:trixie-slim@sha256:a99cfc517144bc59b1978475ec53b46ecabec7e43635402ee5b77cc54cd1b20a

ARG LIBREOFFICE_VERSION=26.8.0.3

# Fonts with the same widths as Times New Roman, Arial, Calibri and Cambria, and a fallback for everything else
RUN sed -i -e '/^URIs:/d' -e 's|^# \(http://snapshot.debian.org/.*\)|URIs: \1|' /etc/apt/sources.list.d/debian.sources \
    && apt-get -o Acquire::Check-Valid-Until=false update \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl poppler-utils \
        fontconfig fonts-liberation2 fonts-crosextra-carlito fonts-crosextra-caladea fonts-dejavu-core \
        libcairo2 libcups2t64 libdbus-1-3 libglib2.0-0t64 libice6 libnss3 libsm6 libx11-xcb1 libxinerama1 libxrandr2 \
    && curl -fsSL "https://downloadarchive.documentfoundation.org/libreoffice/old/${LIBREOFFICE_VERSION}/deb/x86_64/LibreOffice_${LIBREOFFICE_VERSION}_Linux_x86-64_deb.tar.gz" \
        | tar -xz -C /tmp \
    && dpkg -i /tmp/LibreOffice_*/DEBS/*.deb \
    && ln -s /opt/libreoffice*/program/soffice /usr/local/bin/soffice \
    && rm -rf /tmp/LibreOffice_* /var/lib/apt/lists/*

# LibreOffice keeps its settings in the home directory
ENV HOME=/tmp
WORKDIR /work
